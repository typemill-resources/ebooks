<?php

namespace Plugins\Ebooks;

use Typemill\Plugin;
use Typemill\Models\WriteYaml;
use Typemill\Models\WriteCache;
use Typemill\Models\Validation;
use Typemill\Controllers\MetaApiController;
use Typemill\Extensions\ParsedownExtension;
use Valitron\Validator;

class Ebooks extends Plugin
{
    public static function getSubscribedEvents()
    {
		return [
			'onTwigLoaded'				=> ['onTwigLoaded',0],			
			'onMetaDefinitionsLoaded'	=> ['onMetaDefinitionsLoaded',0],
			'onSystemnaviLoaded'		=> ['onSystemnaviLoaded',0],
			'onPageReady'				=> ['onPageReady',0],
		];
    }
	
	public static function addNewRoutes()
	{
		return [
			['httpMethod' => 'get', 'route' => '/tm/ebooks', 'name' => 'ebooks.show', 'class' => 'Typemill\Controllers\SettingsController:showBlank', 'resource' => 'system', 'privilege' => 'view'],
			['httpMethod' => 'get', 'route' => '/api/v1/ebooklayouts', 'name' => 'ebooklayouts.get', 'class' => 'Plugins\Ebooks\Ebooks:getEbookLayouts', 'resource' => 'content', 'privilege' => 'create'],
			['httpMethod' => 'get', 'route' => '/api/v1/ebooktabdata', 'name' => 'ebooktabdata.get', 'class' => 'Plugins\Ebooks\Ebooks:getEbookTabData', 'resource' => 'content', 'privilege' => 'create'],
			['httpMethod' => 'post', 'route' => '/api/v1/ebooktabdata', 'name' => 'ebooktabdata.store', 'class' => 'Plugins\Ebooks\Ebooks:storeEbookTabData', 'resource' => 'content', 'privilege' => 'create'],
			['httpMethod' => 'post', 'route' => '/api/v1/ebooktabitem', 'name' => 'ebooktabitem.store', 'class' => 'Plugins\Ebooks\Ebooks:storeEbookTabItem', 'resource' => 'content', 'privilege' => 'create'],
			['httpMethod' => 'get', 'route' => '/api/v1/ebookdata', 'name' => 'ebookdata.get', 'class' => 'Plugins\Ebooks\Ebooks:getEbookData', 'resource' => 'system', 'privilege' => 'view'],
			['httpMethod' => 'post', 'route' => '/api/v1/ebookdata', 'name' => 'ebookdata.store', 'class' => 'Plugins\Ebooks\Ebooks:storeEbookData', 'resource' => 'system', 'privilege' => 'view'],
			['httpMethod' => 'get', 'route' => '/api/v1/ebooknavi', 'name' => 'ebooknavi.get', 'class' => 'Plugins\Ebooks\Ebooks:getEbookNavi', 'resource' => 'system', 'privilege' => 'view'],
			['httpMethod' => 'get', 'route' => '/tm/ebooks/preview', 'name' => 'ebook.preview', 'class' => 'Plugins\Ebooks\Ebooks:ebookPreview', 'resource' => 'content', 'privilege' => 'create'],
		];
	}

    public function onTwigLoaded($metadata)
   	{
		$this->config = $this->getPluginSettings('ebooks');

		# inject ebook js and css into the editor template
		if(isset($this->config['ebooksinpages']))
		{
	        $this->addEditorCSS('/ebooks/public/ebooks.css');
	        $this->addEditorJS('/ebooks/public/ebookcomponents.js');
	        $this->addEditorJS('/ebooks/public/ebookinpages.js');			
		}
   	}

    public function onMetaDefinitionsLoaded($metadata)
    {
		if(isset($this->config['ebooksinpages']))
		{
			$meta = $metadata->getData();

			# add a tab called "ebook" into pages with no fields, because we will use the fields of the ebook plugin.
			$meta['ebooks'] = ['fields'=> []];

			$metadata->setData($meta);
		}
    }

	public function onSystemnaviLoaded($navidata)
	{
		if(isset($this->config['ebooksinsettings']))
		{
			$this->addSvgSymbol('<symbol id="icon-book" viewBox="0 0 32 32">
				<path d="M28 4v26h-21c-1.657 0-3-1.343-3-3s1.343-3 3-3h19v-24h-20c-2.2 0-4 1.8-4 4v24c0 2.2 1.8 4 4 4h24v-28h-2z"></path>
				<path d="M7.002 26v0c-0.001 0-0.001 0-0.002 0-0.552 0-1 0.448-1 1s0.448 1 1 1c0.001 0 0.001-0 0.002-0v0h18.997v-2h-18.997z"></path>
				</symbol>');

			$navi = $navidata->getData();

			$navi['Ebooks'] = ['routename' => 'ebooks.show', 'icon' => 'icon-book', 'aclresource' => 'system', 'aclprivilege' => 'view'];

			if($this->getPath() == 'tm/ebooks')
			{
				$navi['Ebooks']['active'] = true;
			}

			$navidata->setData($navi);
		}
	}

	public function onPageReady($data)
	{
		# inject ebook template into the settings page
		if( isset($this->config['ebooksinsettings']) && (strpos($this->getPath(), 'tm/ebooks') !== false) )
		{
			# add the css and vue application
		    $this->addCSS('/ebooks/public/ebooks.css');
		    $this->addJS('/ebooks/public/ebookcomponents.js');
		    $this->addJS('/ebooks/public/ebookinsettings.js');
			
			$pagedata = $data->getData();
			
			$twig 	= $this->getTwig();
			$loader = $twig->getLoader();
			$loader->addPath(__DIR__ . '/templates');
			
			# fetch the template and render it with twig
			$content = $twig->fetch('/ebooks.twig', []);

			$pagedata['content'] = $content;
			
			$data->setData($pagedata);
		}
	}

	# gets the centrally stored ebook-data for ebook-plugin in settings-area
	public function getEbookData($request, $response, $args)
	{
		$settings 		= $this->getSettings();

		$folderName 	= 'data' . DIRECTORY_SEPARATOR . 'ebooks';
		$folder 		= $settings['rootPath'] . $folderName;

		if(!$this->checkEbookFolder($folder))
		{
			return $response->withJson(array('data' => false, 'errors' => ['message' => 'Please make sure that the folder data/ebooks exists and is writable.']), 500);
		}

		# write params
		$writeYaml 	= new WriteYaml();

		# get the stored ebook-data
		$formdata = $writeYaml->getYaml($folderName, 'ebookdata.yaml');

		# check formdata for customfields
		

		# get the ebook layout
		$booklayouts = $this->scanEbooklayouts();

		return $response->withJson(array('formdata' => $formdata, 'layoutdata' => $booklayouts, 'errors' => false), 200);
	}

	# gets the stored ebook-data from page yaml for the ebook-plugin in page tab. We have to do it separately because fields are stripped out in tab.
	public function getEbookTabData($request, $response, $args)
	{
		$params 		= $request->getParams();
		$itempath 		= $params['itempath'];
		$settings 		= $this->getSettings();

		# get the metadata from page
		$writeYaml 		= new WriteYaml();

		$meta = $writeYaml->getYaml($settings['contentFolder'], $itempath . '.yaml');

		$formdata = isset($meta['ebooks']) ? $meta['ebooks'] : false;

		# get the ebook layouts
		$booklayouts = $this->scanEbooklayouts();

		return $response->withJson(array('formdata' => $formdata, 'layoutdata' => $booklayouts, 'errors' => false), 200);
	}

	# stores the ebook-data (book-details and navigation) from central ebook in settings-area into the data-folder 
	public function storeEbookData($request, $response, $args)
	{
		$params 		= $request->getParams();
		$settings 		= $this->getSettings();
		$uri 			= $request->getUri()->withUserInfo('');
		$base_url		= $uri->getBaseUrl();

		$folderName 	= 'data' . DIRECTORY_SEPARATOR . 'ebooks';
		$folder 		= $settings['rootPath'] . $folderName;

		if(!$this->checkEbookFolder($folder))
		{
			return $response->withJson(array('data' => false, 'errors' => ['message' => 'Please make sure that the folder data/ebooks exists and is writable.']), 500);
		}

		# create objects to read and write data
		$writeYaml 		= new WriteYaml();
		$writeCache 	= new WriteCache();

		$validatedParams = $this->validateEbookData($params, $writeYaml);

		if(isset($validatedParams['errors']))
		{
			return $response->withJson(array('data' => false, 'errors' => $validatedParams['errors']), 422);
		}
		
		# write params
		$ebookstored 	= $writeYaml->updateYaml($folderName, 'ebookdata.yaml', $validatedParams['data']);
		$navistored 	= $writeCache->updateCache($folderName, 'navigation.txt', false, $validatedParams['navigation']);
		
		if($ebookstored AND $navistored)
		{
			return $response->withJson(array("ebookdata" => $ebookstored, "navidata" => $navistored), 200);
		}

		return $response->withJson(array('data' => false, 'errors' => ['message' => 'We could not store all data. Please try again.']), 500);
	}

	# stores the ebook data from a page tab into the page-yaml
	public function storeEbookTabData($request, $response, $args)
	{
		$params 		= $request->getParams();
		$item 			= $params['item'];
		$settings 		= $this->getSettings();

		# create object to read and write yaml-data
		$writeYaml 		= new WriteYaml();

		# validate the data
		$validatedParams = $this->validateEbookData($params, $writeYaml);

		if(isset($validatedParams['errors']))
		{
			return $response->withJson(array('data' => false, 'errors' => $validatedParams['errors']), 422);
		}

		# get the metadata from page
		$meta = $writeYaml->getYaml($settings['contentFolder'], $item['pathWithoutType'] . '.yaml');

		# add the tab-data for ebooks
		$meta['ebooks'] = $validatedParams['data'];

		# store the metadata for page 
		$writeYaml->updateYaml($settings['contentFolder'], $item['pathWithoutType'] . '.yaml', $meta);

		return $response->withJson(array("ebookdata" => $meta['ebooks']), 200);
	}

	# stores the ebook data from a page tab into the page-yaml
	public function storeEbookTabItem($request, $response, $args)
	{
		$params 		= $request->getParams();
		$item 			= $params['item'];
		$settings 		= $this->getSettings();

		$folderName 	= 'data' . DIRECTORY_SEPARATOR . 'ebooks';
		$folder 		= $settings['rootPath'] . $folderName;

		# create object to read and write cache-data
		$writeCache 	= new WriteCache();

		$tmpitem 		= $writeCache->updateCache($folderName, 'tmpitem.txt', false, $item);
		
		if($tmpitem)
		{
			return $response->withJson(array("tmpitem" => $tmpitem), 200);
		}

		return $response->withJson(array('data' => false, 'errors' => ['message' => 'We could not store all data. Please try again.']), 500);
	}

	# single endpoint to get only the layouts. Not in use right now
	public function getEbookLayouts($request, $response, $args)
	{
		$booklayouts = $this->scanEbookLayouts();

		return $response->withJson(array('layoutdata' => $booklayouts, 'errors' => false), 200);
	}

	# scans the folder with the ebooklayouts and returns layout-names as array
	public function scanEbooklayouts()
	{
		# write params
		$writeYaml 	= new WriteYaml();

		# scan the ebooklayouts folder
		$layoutfolders = array_diff(scandir(__DIR__ . '/booklayouts'), array('..', '.'));
		$booklayouts = [];

		foreach($layoutfolders as $layout)
		{
			$configfolder = 'plugins' . DIRECTORY_SEPARATOR . 'ebooks' . DIRECTORY_SEPARATOR . 'booklayouts' . DIRECTORY_SEPARATOR . $layout;
			$bookconfig = $writeYaml->getYaml($configfolder, 'config.yaml');
			$booklayouts[$layout] = $bookconfig;
		}

		return $booklayouts;
	}

	# gets the ebook navigation from data folder or the general page navigation
	public function getEbookNavi($request, $response, $args)
	{
		$settings 		= $this->getSettings();

		$folderName 	= 'data' . DIRECTORY_SEPARATOR . 'ebooks';
		$folder 		= $settings['rootPath'] . $folderName;

		if(!$this->checkEbookFolder($folder))
		{
			return $response->withJson(array('data' => false, 'errors' => ['message' => 'Please make sure that the folder data/ebooks exists and is writable.']), 500);
		}

		# write params
		$writeCache 	= new WriteCache();
		$navigation 	= $writeCache->getCache($folderName, 'navigation.txt');

		if(!$navigation)
		{
			$navigation = $writeCache->getCache('cache', 'structure.txt');
		}

		if(!$navigation)
		{
			return $response->withJson(array('data' => false, 'errors' => ['message' => 'We did not find a content tree. Please reload the page.']), 422);
		}

		return $response->withJson(array('data' => $navigation, 'errors' => false), 200);
	}

	# validates the ebook-input data from both, the tab and the centrally used ebook-feature
	private function validateEbookData($params, $writeYaml)
	{
		$formdata		= isset($params['data']) ? $params['data'] : false;
		$layout 		= isset($params['data']['layout']) ? $params['data']['layout'] : false;
		$errors			= false;

		# return error if either formdata or layoutdata not present

		# check if navigation is there
		if(!isset($params['navigation']) OR empty($params['navigation']) OR !$params['navigation'])
		{
			$errors['content'] = ['Content is missing'];
		}

		# create validation object
		$validation	= new Validation();

		# return standard valitron object for standardfields
		$v = $validation->returnValidator($formdata);

		# validation rules for standard fields:
		$v->rule('boolean', 'hyphens');
		$v->rule('boolean', 'endnotes');
		$v->rule('boolean', 'coverimageonly');
		$v->rule('boolean', 'toc');
		$v->rule('boolean', 'toccounter');
		$v->rule('boolean', 'originalimages');
		$v->rule('boolean', 'originalheadlinelevels');
		$v->rule('lengthMax', 'layout', 20);
		$v->rule('lengthMax', 'hyphentest', 100);
		$v->rule('lengthMax', 'language', 5);
		$v->rule('lengthMax', 'endnotestitle', 80);
		$v->rule('lengthMax', 'title', 80);
		$v->rule('lengthMax', 'subtitle', 80);
		$v->rule('lengthMax', 'author', 80);
		$v->rule('lengthMax', 'edition', 80);
		$v->rule('lengthMax', 'coverimage', 200);
		$v->rule('lengthMax', 'imprint', 1500);
		$v->rule('lengthMax', 'dedication', 1500);
		$v->rule('lengthMax', 'toctitle', 80);
		$v->rule('lengthMax', 'toclevel', 3);
		$v->rule('lengthMax', 'blurb', 1500);
		$v->rule('lengthMax', 'primarycolor', 20);
		$v->rule('lengthMax', 'secondarycolor', 20);
		$v->rule('noHTML', 'layout');
		$v->rule('noHTML', 'hyphentest');
		$v->rule('noHTML', 'language');
		$v->rule('noHTML', 'endnotestitle');
		$v->rule('noHTML', 'title');
		$v->rule('noHTML', 'subtitle');
		$v->rule('noHTML', 'author');
		$v->rule('noHTML', 'edition');
		$v->rule('noHTML', 'coverimage');
		$v->rule('noHTML', 'imprint');
		$v->rule('noHTML', 'dedication');
		$v->rule('noHTML', 'toctitle');
		$v->rule('noHTML', 'toclevel');
		$v->rule('noHTML', 'blurb');
		$v->rule('noHTML', 'primarycolor');
		$v->rule('noHTML', 'secondarycolor');

		if(!$v->validate())
		{
			$errors = $v->errors();
		}

		# list all standardfields
		$standardfields	= [
			'layout',
			'hyphens',
			'hyphentest',
			'language',
			'endnotes',
			'endnotestitle',
			'title',
			'subtitle',
			'author',
			'edition',
			'coverimage',
			'coverimageonly',
			'imprint',
			'dedication',
			'toc',
			'toctitle',
			'toclevel',
			'toccounter',
			'blurb',
			'primarycolor',
			'secondarycolor',
			'content',
			'originalheadlinelevels',
			'originalimages'
		];

		# delete the standardfields from formdata
		foreach($standardfields as $standardfield)
		{
			if(isset($formdata[$standardfield]))
			{
				unset($formdata[$standardfield]);
			}
		}

		# validate the customforms: if formdata are not empty now, then we have customfields
		if(!empty($formdata && $layout))
		{

			# get the customfield configurations from booklayout folder			
			$configfolder 	= 'plugins' . DIRECTORY_SEPARATOR . 'ebooks' . DIRECTORY_SEPARATOR . 'booklayouts' . DIRECTORY_SEPARATOR . $layout;
			$bookconfig 	= $writeYaml->getYaml($configfolder, 'config.yaml');

			# validation loop: code taken from metaApiController
			foreach($formdata as $fieldName => $fieldValue)
			{
				# get the corresponding field definition from original plugin settings */
				$fieldDefinition = isset($bookconfig['customforms']['fields'][$fieldName]) ? $bookconfig['customforms']['fields'][$fieldName] : false;

				if(!$fieldDefinition)
				{
					$errors[$fieldName] = 'This field is not defined';
				}
				else
				{
					# validate user input for this field
					$result = $validation->objectField($fieldName, $fieldValue, 'meta', $fieldDefinition);

					if($result !== true)
					{
						$errors[$fieldName] = $result[$fieldName][0];
					}

					/*
					# special treatment for customfields 
					if($fieldDefinition && isset($fieldDefinition['type']) && ($fieldDefinition['type'] == 'customfields' ) )
					{
						$arrayFeatureOn = false;
						if(isset($fieldDefinition['data']) && ($fieldDefinition['data'] == 'array'))
						{
							$arrayFeatureOn = true;
						}

						$params['data'][$fieldName] = $this->customfieldsPrepareForSave($formdata[$fieldName], $arrayFeatureOn);
					}
					*/
				}
			}
		}

		if($errors)
		{
			return array('errors' => $errors);
		}

		# return the validated params which also hold optimized data for customfields
		return $params;
	}

	# generates the ebook-preview
	public function ebookPreview($request, $response, $args)
	{
		$params 		= $request->getParams();
		$settings 		= $this->getSettings();
		$uri 			= $request->getUri()->withUserInfo('');
		$base_url		= $uri->getBaseUrl();

		$writeYaml 		= new WriteYaml();
		$writeCache 	= new WriteCache();

		$ebookFolderName 	= 'data' . DIRECTORY_SEPARATOR . 'ebooks';
		# $ebookFolderPath 	= $settings['rootPath'] . $folderName;

		# check if call comes from a tab
		if(!empty($params) && isset($params['itempath']))
		{
			# wait for a second to make super sure that the temporary item has been stored by vue-script
			usleep(200000);

			# get bookdata from the page
			$meta 		= $writeYaml->getYaml($settings['contentFolder'], $params['itempath'] . '.yaml');
			$ebookdata 	= isset($meta['ebooks']) ? $meta['ebooks'] : false;

			$navigation = $writeCache->getCache($ebookFolderName, 'tmpitem.txt');

			# should we delete the old tmpitem.txt here or simply let next overwrite it?
		}
		# otherwise it is from the settings
		else
		{
			# get bookdata
			$ebookdata 	= $writeYaml->getYaml($ebookFolderName, 'ebookdata.yaml');

			# get navigationdata
			$navigation = $writeCache->getCache($ebookFolderName, 'navigation.txt');
		}

		# generate the book content from ebook-navigation
		$parsedown 		= new ParsedownExtension($base_url);
		$pathToContent	= $settings['rootPath'] . $settings['contentFolder'];
		$book 			= $this->generateContent([], $navigation, $pathToContent, $parsedown, $ebookdata);

		# let us add the thumb index:
		$book['thumbindex'] = false;

		foreach($book as $chapter)
		{
			if( isset($chapter['metadata']['language']['lang']) && ($chapter['metadata']['language']['lang'] != '') && isset($chapter['metadata']['language']['thumb']) && ($chapter['metadata']['language']['thumb'] != '') )
			{
				$book['thumbindex'][] = ['lang' => $chapter['metadata']['language']['lang'], 'thumb' =>  $chapter['metadata']['language']['thumb'] ];
			}
		}

		$twig   		= $this->getTwig();
		$loader 		= $twig->getLoader();
		$loader->addPath(__DIR__ . '/templates', 'ebooks');
		$loader->addPath(__DIR__ . '/booklayouts/' . $ebookdata['layout'], 'booklayouts');
		
		return $twig->render($response, '@booklayouts/index.twig', [
			'settings' 		=> $settings, 
			'ebookdata' 	=> $ebookdata, 
			'book' 			=> $book
		]);
	}

	public function generateContent($book, $navigation, $pathToContent, $parsedown, $ebookdata)
	{
		$originalheadlinelevels 	= isset($ebookdata['originalheadlinelevels']) ? $ebookdata['originalheadlinelevels'] : false;
		$originalimages 			= isset($ebookdata['originalimages']) ? $ebookdata['originalimages'] : false;

		foreach($navigation as $item)
		{

			if($item['status'] == "published")
			{				
				# if page or folder is excluded from book content
				if(isset($item['exclude']) && $item['exclude'] == true)
				{
					continue;
				}

				# set the filepath
				$filePath 	= $pathToContent . $item['path'];
				$metaPath 	= $pathToContent . $item['pathWithoutType'] . '.yaml';
				
				# check if url is a folder and add index.md 
				if($item['elementType'] == 'folder')
				{
					$filePath 	= $filePath . DIRECTORY_SEPARATOR . 'index.md';
				}

				# read the content of the file
				$chapter 			= file_exists($filePath) ? file_get_contents($filePath) : false;
				
				# get the meta
				$meta 				= file_exists($metaPath) ? file_get_contents($metaPath) : false;
				if($meta)
				{
					$meta 			= \Symfony\Component\Yaml\Yaml::parse($meta);
				}

				# turn into an array
				$chapterArray 		= $parsedown->text($chapter, $itemUrl = false);

				# check the hierarchy of the current page within the navigation
				$chapterlevel = count($item['keyPathArray']);

				# we have to overwrite headlines and/or image urls if user selected those options
				if( $originalimages OR ( !$originalheadlinelevels && $chapterlevel > 1 ) )
				{
					# go through each content element
					foreach($chapterArray as $key => $element)
					{
						# if user wants to use original images instead of small once
						if($originalimages && $element['name'] == 'figure')
						{
							# rewrite the image urls
							$image = $element['elements'][0]['handler']['argument'];
							$element['elements'][0]['handler']['argument'] = str_replace("media/live/", "media/original/", $image);
							$chapterArray[$key] = $element;
						}

						# by default and if user did not contradict to automatically adjust the headline levels
						if(!$originalheadlinelevels AND isset($element['name'][1]) AND $element['name'][0] == 'h' AND is_numeric($element['name'][1]))
						{
							# lower the levels of headlines
							$headlinelevel = $element['name'][1] + ($chapterlevel -1);
							$headlinelevel = ($headlinelevel > 6) ? 6 : $headlinelevel;
							$chapterArray[$key]['name'] = 'h' . $headlinelevel;
						}
					}
				}

				# turn into html
				$chapterHTML		= $parsedown->markup($chapterArray, $itemUrl = false);

				$book[] = ['item' => $item, 'level' => $chapterlevel, 'content' => $chapterHTML, 'metadata' => $meta];

				if($item['elementType'] == 'folder')
				{
					$book 	= $this->generateContent($book, $item['folderContent'], $pathToContent, $parsedown, $ebookdata);
				}
			}
		}
		return $book;
	}

	public function checkEbookFolder($folder)
	{

		if(!file_exists($folder) && !is_dir( $folder ))
		{
			if(!mkdir($folder, 0755, true))
			{
				return false;
			}
		}
		elseif(!is_writeable($folder) OR !is_readable($folder))
		{
			return false;
		}

		return true;
	}

}