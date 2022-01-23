<?php

namespace Plugins\Ebooks;

include 'vendor/autoload.php';

use Typemill\Plugin;
use Typemill\Models\WriteYaml;
use Typemill\Models\WriteCache;
use Typemill\Models\Validation;
use Typemill\Controllers\MetaApiController;
use Typemill\Extensions\ParsedownExtension;
use Valitron\Validator;
use PHPePub\Core\EPub;
use PHPePub\Core\Logger;
use PHPePub\Core\Structure\OPF\DublinCore;
use PHPePub\Helpers\CalibreHelper;
use PHPePub\Helpers\IBooksHelper;
use PHPePub\Helpers\Rendition\RenditionHelper;
use PHPePub\Helpers\URLHelper;
use PHPZip\Zip\File\Zip;

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
			['httpMethod' => 'get', 'route' => '/tm/ebooks', 'name' => 'ebooks.show', 'class' => 'Typemill\Controllers\ControllerSettings:showBlank', 'resource' => 'system', 'privilege' => 'view'],
			['httpMethod' => 'get', 'route' => '/api/v1/ebooklayouts', 'name' => 'ebooklayouts.get', 'class' => 'Plugins\Ebooks\Ebooks:getEbookLayouts', 'resource' => 'content', 'privilege' => 'create'],
			['httpMethod' => 'get', 'route' => '/api/v1/ebooktabdata', 'name' => 'ebooktabdata.get', 'class' => 'Plugins\Ebooks\Ebooks:getEbookTabData', 'resource' => 'content', 'privilege' => 'create'],
			['httpMethod' => 'post', 'route' => '/api/v1/ebooktabdata', 'name' => 'ebooktabdata.store', 'class' => 'Plugins\Ebooks\Ebooks:storeEbookTabData', 'resource' => 'content', 'privilege' => 'create'],
			['httpMethod' => 'post', 'route' => '/api/v1/ebooktabitem', 'name' => 'ebooktabitem.store', 'class' => 'Plugins\Ebooks\Ebooks:storeEbookTabItem', 'resource' => 'content', 'privilege' => 'create'],
			['httpMethod' => 'get', 'route' => '/api/v1/ebookdata', 'name' => 'ebookdata.get', 'class' => 'Plugins\Ebooks\Ebooks:getEbookData', 'resource' => 'system', 'privilege' => 'view'],
			['httpMethod' => 'post', 'route' => '/api/v1/ebookdata', 'name' => 'ebookdata.store', 'class' => 'Plugins\Ebooks\Ebooks:storeEbookData', 'resource' => 'system', 'privilege' => 'view'],
			['httpMethod' => 'get', 'route' => '/api/v1/ebooknavi', 'name' => 'ebooknavi.get', 'class' => 'Plugins\Ebooks\Ebooks:getEbookNavi', 'resource' => 'system', 'privilege' => 'view'],
			['httpMethod' => 'post', 'route' => '/api/v1/headlinepreview', 'name' => 'headline.preview', 'class' => 'Plugins\Ebooks\Ebooks:generateHeadlinePreview', 'resource' => 'content', 'privilege' => 'create'],
			['httpMethod' => 'get', 'route' => '/api/v1/epubuuid', 'name' => 'epub.uuid', 'class' => 'Plugins\Ebooks\Ebooks:generateUuidV4', 'resource' => 'content', 'privilege' => 'create'],
			['httpMethod' => 'get', 'route' => '/tm/ebooks/preview', 'name' => 'ebook.preview', 'class' => 'Plugins\Ebooks\Ebooks:ebookPreview', 'resource' => 'content', 'privilege' => 'create'],
			['httpMethod' => 'get', 'route' => '/tm/ebooks/epub', 'name' => 'ebook.epub', 'class' => 'Plugins\Ebooks\Ebooks:createEpub', 'resource' => 'content', 'privilege' => 'create'],
		];
	}

	# ebooks in pages
    public function onTwigLoaded($metadata)
   	{
		$this->config = $this->getPluginSettings('ebooks');

		if($this->adminpath)
		{
			if( isset($this->config['ebooksinpages']) && (strpos($this->path, 'tm/content') !== false) )
			{
				$this->addEditorCSS('/ebooks/public/ebooks.css');
				$this->addEditorJS('/ebooks/public/ebookcomponents.js');
				$this->addEditorJS('/ebooks/public/ebookinpages.js');

				# inject thumbindex.js into pages if activated
				if(isset($this->config['thumbindex']))
				{
			        $this->addEditorJS('/ebooks/public/thumbindex.js');
				}
			}
		}
   	}

    public function onMetaDefinitionsLoaded($metadata)
    {
		$meta = $metadata->getData();

		$thumbindex = false;

		if(isset($this->config['ebooksinpages']))
		{
			# add a tab called "ebook" into pages with no fields, because we will use the fields of the ebook plugin.
			$meta['ebooks'] = ['fields'=> []];

			if(isset($this->config['thumbindex']))
			{
				$thumbindex = true;

				$languageString = $this->config['languages'];

		        # standardize line breaks
        		$text = str_replace(array("\r\n", "\r"), "\n", $languageString);

		        # remove surrounding line breaks
        		$text = trim($text, "\n");

		        # split text into lines
        		$lines = explode("\n", $text);

        		# set initial value that will clear the values
        		$languages = ['clear' => ''];

        		# add values from textarea-field in the settings
        		foreach($lines as $line)
        		{
        			$keyvalue = explode(':', $line);
        			if(isset($keyvalue[0]) && isset($keyvalue[1]))
        			{
        				$languages[trim($keyvalue[0])] = trim($keyvalue[1]);	
        			}
        		}

				$meta['thumbindex']['fields']['language']['options'] = $languages;
			}
		}
		if(!$thumbindex)
		{
			unset($meta['thumbindex']);
		}
		
		$metadata->setData($meta);
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

	# ebooks in settings
	public function onPageReady($data)
	{
		if($this->adminpath)
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

		if($params['url'] == '/')
		{
			return $response->withJson(array('home' => true, 'errors' => ['message' => "The homepage does not support the ebook generation. Please go to the subpages or use the ebook tab in the settings if you want to create an ebook from the whole website."]), 422);
		}

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

	# stores the navigation for the ebook from a tab into a temporary file
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
			return $response->withJson(array('data' => false, 'errors' => ['message' => 'We did not find a content tree. Please visit the website frontend to generate the tree.', 'disable' => true]), 422);
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

		# list all standardfields
		$standardfields	= [
			'layout',
			'activeshortcodes',
			'disableshortcodes',
			'downgradeheadlines',
			'excludebasefolder',
			'epubidentifierisbn',
			'epubidentifieruuid',
			'epubidentifieruri',
			'epubcover',
			'epubdescription',
			'epubsubjects',
			'epubauthorfirstname',
			'epubauthorlastname',
			'epubpublishername',
			'epubpublisherurl',
			'epubtocname', 
			'epubtitlepage', 
			'epubchaptername', 
			'epubchapternumber',
			'epubdebug'
		];

		# create validation object
		$validation	= new Validation();

		# return standard valitron object for standardfields
		$v = $validation->returnValidator($formdata);

		$v->rule('noHTML', 'blurb');
		$v->rule('noHTML', 'primarycolor');
		$v->rule('noHTML', 'secondarycolor');

		if(!$v->validate())
		{
			$errors = $v->errors();
		}

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
			$customforms	= $this->withoutFieldsets($bookconfig['customforms']['fields'], []);

			# validation loop: code taken from metaApiController
			foreach($formdata as $fieldName => $fieldValue)
			{
				# get the corresponding field definition from original plugin settings
				$fieldDefinition = isset($customforms[$fieldName]) ? $customforms[$fieldName] : false;

				if(!$fieldDefinition)
				{
					# we simply delete the params that are not defined to avoid errors. For example, if field-definitions have been changed in a new version
					unset($params['data'][$fieldName]);
				}
				else
				{
					# validate user input for this field
					$result = $validation->objectField($fieldName, $fieldValue, 'meta', $fieldDefinition);

					if($result !== true)
					{
						$errors[$fieldName] = $result[$fieldName][0];
					}
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
		$parsedown 		= new ParsedownExtension($base_url, $settingsForHeadlineAnchors = false, $this->getDispatcher());
		
		# the default mode is with footnotes, but user can activate endnotes too
		if(!isset($ebookdata['endnotes']) or !$ebookdata['endnotes'])
		{
			# if default mode, then we get a different html from parsedown 
			$parsedown->withSpanFootnotes();
		}

		# check if shortcodes should be rendered
		if(isset($ebookdata['disableshortcodes']) && $ebookdata['disableshortcodes'])
		{
			# empty array will stop all shortcodes
			$parsedown->setAllowedShortcodes(array());
		}
		elseif(isset($ebookdata['activeshortcodes']) && is_array($ebookdata['activeshortcodes']) && !empty($ebookdata['activeshortcodes']))
		{
			# only selected shortcodes will be rendered
			$parsedown->setAllowedShortcodes($ebookdata['activeshortcodes']);
		}



		# skip the base folder if activated
		if(isset($ebookdata['excludebasefolder']) and $ebookdata['excludebasefolder'] and isset($navigation[0]['folderContent']))
		{
			$navigation = $navigation[0]['folderContent'];
		}

		$pathToContent	= $settings['rootPath'] . $settings['contentFolder'];
		$book 			= $this->generateContent([], $navigation, $pathToContent, $parsedown, $ebookdata);

		# let us add the thumb index:
		$thumbindex = false;

		foreach($book as $chapter)
		{
			if( isset($chapter['metadata']['thumbindex']['language']) && ($chapter['metadata']['thumbindex']['language'] != 'clear'))
			{
				$thumbindex[$chapter['metadata']['thumbindex']['lang']] = ['lang' => $chapter['metadata']['thumbindex']['lang'], 'thumb' =>  $chapter['metadata']['thumbindex']['thumb'] ];
			}
		}

		# we have to dispatch onTwigLoaded to get javascript from other plugins
		$this->container->dispatcher->dispatch('onTwigLoaded');		

		$twig   		= $this->getTwig();
		$loader 		= $twig->getLoader();
		$loader->addPath(__DIR__ . '/templates', 'ebooks');
		$loader->addPath(__DIR__ . '/booklayouts/' . $ebookdata['layout'], 'booklayouts');
	
		$booklayouts = $this->scanEbooklayouts();

		return $twig->render($response, '@booklayouts/index.twig', [
			'settings' 		=> $settings, 
			'ebookdata' 	=> $ebookdata, 
			'booklayout'	=> $booklayouts[$ebookdata['layout']],
			'book' 			=> $book,
			'thumbindex'	=> $thumbindex
		]);
	}

	public function generateContent($book, $navigation, $pathToContent, $parsedown, $ebookdata, $chapterlevel = NULL)
	{
		# before we use this logic, we have to check if the current layout supports that feature.
		# please check here
		# or we should delete everything that is not related to the layout in the ebook-data first.

		$originalimages 			= isset($ebookdata['originalimages']) ? $ebookdata['originalimages'] : false;
		$downgradeheadlines 		= isset($ebookdata['downgradeheadlines']) ? $ebookdata['downgradeheadlines'] : 0;
		$chapterlevel				= $chapterlevel ? $chapterlevel : 1;

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
				# $chapterlevel = count($item['keyPathArray']);

				# we have to overwrite headlines and/or image urls if user selected those options
				# if( $originalimages OR ( !$originalheadlinelevels && $chapterlevel > 1 ) )
				if( $originalimages OR $chapterlevel >= ($downgradeheadlines+1)  )
				{
					# go through each content element
					foreach($chapterArray as $key => $element)
					{
						# if user wants to use original images instead of small once
						if($originalimages && isset($element['name']) && $element['name'] == 'figure')
						{
							# rewrite the image urls
							$image = $element['elements'][0]['handler']['argument'];
							$element['elements'][0]['handler']['argument'] = str_replace("media/live/", "media/original/", $image);
							$chapterArray[$key] = $element;
						}

						/*
						# by default and if user did not contradict to automatically adjust the headline levels
						if(!$originalheadlinelevels AND isset($element['name'][1]) AND $element['name'][0] == 'h' AND is_numeric($element['name'][1]))
						{
							# lower the levels of headlines
							$headlinelevel = $element['name'][1] + ($chapterlevel -1);
							$headlinelevel = ($headlinelevel > 6) ? 6 : $headlinelevel;
							$chapterArray[$key]['name'] = 'h' . $headlinelevel;
						}
						*/
						if($downgradeheadlines == 0)
						{
							continue;
						}

						# adjust the headline levels
						if( ($chapterlevel >= ($downgradeheadlines+1) ) AND isset($element['name'][1]) AND $element['name'][0] == 'h' AND is_numeric($element['name'][1]))
						{
							# lower the levels of headlines
							$headlinelevel = $element['name'][1] + ($chapterlevel - $downgradeheadlines);
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
					$book 	= $this->generateContent($book, $item['folderContent'], $pathToContent, $parsedown, $ebookdata, $chapterlevel + 1 );
				}
			}
		}
		return $book;
	}

	public function generateHeadlinePreview($request, $response, $args)
	{
		$params 		= $request->getParams();
		$settings 		= $this->getSettings();
		$uri 			= $request->getUri()->withUserInfo('');
		$base_url		= $uri->getBaseUrl();

		$writeYaml 		= new WriteYaml();
		$writeCache 	= new WriteCache();

		$ebookFolderName 	= 'data' . DIRECTORY_SEPARATOR . 'ebooks';

		# check if call comes from a tab
		if(isset($params['item']) && isset($params['ebookdata']))
		{
			$ebookdata 	= $params['ebookdata'];

			$navigation = $params['item'];
		}
		# otherwise it is from the settings
		else
		{
			# get bookdata
			$ebookdata 	= $writeYaml->getYaml($ebookFolderName, 'ebookdata.yaml');

			# get navigationdata
			$navigation = $writeCache->getCache($ebookFolderName, 'navigation.txt');
		}

		# skip the base folder if activated
		if(isset($ebookdata['excludebasefolder']) and $ebookdata['excludebasefolder'] and isset($navigation[0]['folderContent']))
		{
			$navigation = $navigation[0]['folderContent'];
		}

		# generate the book content from ebook-navigation
		$parsedown 		= new ParsedownExtension($base_url);
				
		$pathToContent	= $settings['rootPath'] . $settings['contentFolder'];
		$headlines 		= $this->generateArrayOfHeadlineElements([], $navigation, $pathToContent, $parsedown, $ebookdata);

		return $response->withJson(array('headlines' => $headlines, 'errors' => false), 200);
	}

	private function generateArrayOfHeadlineElements($headlines, $navigation, $pathToContent, $parsedown, $ebookdata, $chapterlevel = NULL)
	{
		$downgradeheadlines 		= isset($ebookdata['downgradeheadlines']) ? $ebookdata['downgradeheadlines'] : 0;
		$chapterlevel				= $chapterlevel ? $chapterlevel : 1;

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
				
				# check if url is a folder and add index.md 
				if($item['elementType'] == 'folder')
				{
					$filePath 	= $filePath . DIRECTORY_SEPARATOR . 'index.md';
				}

				# read the content of the file
				$chapter 			= file_exists($filePath) ? file_get_contents($filePath) : false;
				
				# turn into an array
				$chapterArray 		= $parsedown->text($chapter, $itemUrl = false);

				# go through each content element
				foreach($chapterArray as $key => $element)
				{
					# check if it is a headline
					if( isset($element['name'][1]) AND $element['name'][0] == 'h' AND is_numeric($element['name'][1]))
					{
						if( ( $downgradeheadlines > 0 ) && ( $chapterlevel >= ($downgradeheadlines+1) ) )
						{
							# lower the levels of headlines
							$headlinelevel = $element['name'][1] + ($chapterlevel - $downgradeheadlines);
							$element['name'][1] = ($headlinelevel > 6) ? 6 : $headlinelevel;
						}
						$headlines[] = ['name' => $element['name'], 'level' => $element['name'][1], 'text' => $element['handler']['argument']];
					}
				}

				if($item['elementType'] == 'folder')
				{
					$headlines = $this->generateArrayOfHeadlineElements($headlines, $item['folderContent'], $pathToContent, $parsedown, $ebookdata, $chapterlevel + 1 );
				}
			}
		}
		return $headlines;
	}

	# generates and returns the epub file
	public function createEpub($request, $response, $args)
	{
		ob_end_flush();

		error_reporting(E_ALL | E_STRICT);
		ini_set('error_reporting', E_ALL | E_STRICT);
		ini_set('display_errors', 0);
		
		$params 		= $request->getParams();
		$settings 		= $this->getSettings();
		$uri 			= $request->getUri()->withUserInfo('');
		$base_url		= $uri->getBaseUrl();

		$writeYaml 		= new WriteYaml();
		$writeCache 	= new WriteCache();

		$ebookFolderName 	= 'data' . DIRECTORY_SEPARATOR . 'ebooks';

		# check if call comes from a tab
		if(!empty($params) && isset($params['itempath']))
		{
			# wait for a second to make super sure that the temporary item has been stored by vue-script
			usleep(200000);

			# get bookdata from the page
			$meta 		= $writeYaml->getYaml($settings['contentFolder'], $params['itempath'] . '.yaml');
			$ebookdata 	= isset($meta['ebooks']) ? $meta['ebooks'] : false;

			$navigation = $writeCache->getCache($ebookFolderName, 'tmpitem.txt');
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

		$parsedown->withSpanFootnotes();
		
		$pathToContent	= $settings['rootPath'] . $settings['contentFolder'];
		$bookcontent 	= $this->generateContent([], $navigation, $pathToContent, $parsedown, $ebookdata);

		# START EPUB 

		# setting timezone for time functions used for logging to work properly
		date_default_timezone_set('Europe/Berlin');
		$log = new Logger("Example", TRUE);

#		$fileDir = './PHPePub';

		# ePub 3 is not fully implemented. but aspects of it is, in order to help implementers.
		# ePub 3 uses HTML5, formatted strictly as if it was XHTML but still using just the HTML5 doctype (aka XHTML5)
		$book = new EPub(EPub::BOOK_VERSION_EPUB3, "en", EPub::DIRECTION_LEFT_TO_RIGHT); // Default is ePub 2
		$log->logLine("new EPub()");
		$log->logLine("EPub class version.: " . EPub::VERSION);
		$log->logLine("Zip version........: " . Zip::VERSION);
		$log->logLine("getCurrentServerURL: " . URLHelper::getCurrentServerURL());
		$log->logLine("getCurrentPageURL..: " . URLHelper::getCurrentPageURL());

		if(!isset($ebookdata['title']) OR $ebookdata['title'] == '')
		{
			$response->write('There is no title. A book title is mandatory, we cannot create an ePub without that.');
			return $response;			
		}

		# Title and Identifier are mandatory!
		$book->setTitle($ebookdata['title']);
		
		# Could also be the ISBN number, preferred for published books, or a UUID like https://www.php.net/manual/en/function.uniqid.php
		if(isset($ebookdata['epubidentifierisbn']) && $ebookdata['epubidentifierisbn'] != '')
		{
			$book->setIdentifier($ebookdata['epubidentifierisbn'], EPub::IDENTIFIER_ISBN);
		}
		elseif(isset($ebookdata['epubidentifieruuid']) && $ebookdata['epubidentifieruuid'] != '')
		{
			$book->setIdentifier($ebookdata['epubidentifieruuid'], EPub::IDENTIFIER_UUID);
		}
		elseif(isset($ebookdata['epubidentifieruri']) && $ebookdata['epubidentifieruri'] != '')
		{
			$book->setIdentifier($ebookdata['epubidentifieruri'], EPub::IDENTIFIER_URI);
		}
		else
		{
			$response->write('There is no epub identifier. An identifier is mandatory, we cannot create an ePub without that.');
			return $response;
		}

		# Not needed, but included for the example, Language is mandatory, but EPub defaults to "en". Use RFC3066 Language codes, such as "en", "da", "fr" etc.
		if(isset($settings['langattr']) && $settings['langattr'] != '')
		{
			$book->setLanguage($settings['langattr']);
		}

		if(isset($ebookdata['epubdescription']) && $ebookdata['epubdescription'] != '')
		{
			$book->setDescription($ebookdata['epubdescription']);
		}

		if(isset($ebookdata['epubauthorfirstname']) && $ebookdata['epubauthorfirstname'] != '' && isset($ebookdata['epubauthorlastname']) && $ebookdata['epubauthorlastname'] != '')
		{
			$book->setAuthor($ebookdata['epubauthorfirstname'] . ' ' . $ebookdata['epubauthorlasttname'], $ebookdata['epubauthorlasttname'] . ', ' . $ebookdata['epubauthorfirstname']);
		}

		if(isset($ebookdata['epubpublishername']) && $ebookdata['epubpublishername'] != '')
		{
			$publisherurl =  isset($ebookdata['epubpublisherurl']) ? $ebookdata['epubpublisherurl'] : '';
			$book->setPublisher($ebookdata['epubpublishername'], $publisherurl);
		}

		# Strictly not needed as the book date defaults to time().
		$book->setDate(time());

		# As this is generated, this _could_ contain the name or licence information of the user who purchased the book, if needed. If this is used that way, the identifier must also be made unique for the book.
		if(isset($ebookdata['epubrights']) && $ebookdata['epubrights'] != '')
		{
			$book->setRights($ebookdata['epubrights']);
		}

		if(isset($ebookdata['epubsourceurl']) && $ebookdata['epubsourceurl'] != '')
		{
			$book->setSourceURL($ebookdata['epubsourceurl']);
		}

		$book->addDublinCoreMetadata(DublinCore::CONTRIBUTOR, "PHP");

		if(isset($ebookdata['epubsubjects']) && $ebookdata['epubsubjects'] != '' )
		{
			$subjects = array_map('trim', explode(',', $ebookdata['epubsubjects']));

			foreach($subjects as $subject)
			{
				$book->setSubject($subject);
			}
		}

		# Insert custom meta data to the book, in this case, Calibre series index information.
		CalibreHelper::setCalibreMetadata($book, $ebookdata['title'], "3");

		# FIXED-LAYOUT METADATA (ONLY AVAILABLE IN EPUB3)
		# RenditionHelper::addPrefix($book);
		# RenditionHelper::setLayout($book, RenditionHelper::LAYOUT_PRE_PAGINATED);
		# RenditionHelper::setOrientation($book, RenditionHelper::ORIENTATION_AUTO);
		# RenditionHelper::setSpread($book, RenditionHelper::SPREAD_AUTO);

		# Setting rendition parameters for fixed layout requires the user to add a viewport to each html file.
		# It is up to the user to do this, however the cover image and toc files are generated by the EPub class, and need the information.
		# It can be set multiple times if different viewports are needed for the cover image page and toc.
		# $book->setViewport("720p");

		# IBooksHelper::addPrefix($book);
		# IBooksHelper::setIPadOrientationLock($book, IBooksHelper::ORIENTATION_PORTRAIT_ONLY);
		# IBooksHelper::setIPhoneOrientationLock($book, IBooksHelper::ORIENTATION_PORTRAIT_ONLY);
		# IBooksHelper::setSpecifiedFonts($book, true);
		# IBooksHelper::setFixedLayout($book, true);

		$log->logLine("Set up parameters");

		# ePub 3 uses a variant of HTML5 called XHTML5
		$content_start =
		    "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n"
		    . "<html xmlns=\"http://www.w3.org/1999/xhtml\" xmlns:epub=\"http://www.idpf.org/2007/ops\">\n"
		    . "\t<head>"
		    . "\t\t<meta http-equiv=\"Default-Style\" content=\"text/html; charset=utf-8\" />\n"
		    . $book->getViewportMetaLine() // generate the viewport meta line if the viewport is set.
		    . "\t\t<link rel=\"stylesheet\" type=\"text/css\" href=\"styles.css\" />\n"
		    . "\t\t<title>" . $ebookdata['title'] . "</title>\n"
		    . "\t</head>\n"
		    . "\t<body>\n";

		$bookEnd = "\t</body>\n</html>\n";

		# original
		# $cssData = "body {\n  margin-left: .5em;\n  margin-right: .5em;\n  text-align: justify;\n}\n\np {\n  font-family: serif;\n  font-size: 10pt;\n  text-align: justify;\n  text-indent: 1em;\n  margin-top: 0px;\n  margin-bottom: 1ex;\n}\n\nh1, h2 {\n  font-family: sans-serif;\n  font-style: italic;\n  text-align: center;\n  background-color: #6b879c;\n  color: white;\n  width: 100%;\n}\n\nh1 {\n    margin-bottom: 2px;\n}\n\nh2 {\n    margin-top: -2px;\n    margin-bottom: 2px;\n}\n";

		# https://github.com/weitblick/epub/blob/main/static/OEBPS/css/stylesheet.css
		# $cssData = 'html{padding:1em;margin:1em;font-family:sans-serif}h1{font-size:2.0em;padding:0;margin:1em;text-align:center}h2{font-size:1.5em;padding:0;margin:1em;text-align:center}h3{font-size:1.2em;padding:0;margin:1em;text-align:center}.introtext,h4{font-size:1.2em;padding:0;margin:1em;text-align:center}h5{font-size:1.0em;padding:0;margin:1em;text-align:center}h6{font-size:1.0em;padding:0;margin:1em;text-align:center}abbr[title],acronym[title],span[title]{border-bottom:thin dotted}abbr,acronym,kbd,var{font-family:serif}code,h6,kbd,var{font-weight:bold}code{background-color:lightgray}p{text-indent:0;display:block;margin-top:1em;margin-bottom:1em}article,aside,nav,section{display:block;margin:1ex;padding:1em}footer,header{display:block;border:thin solid;padding:1em}main{display:block}section{border-top:thin dotted;border-bottom:thin dotted}aside{border-left:thin dotted;font-size:0.9em}blockquote{margin-left:0;border-left:thin dotted;margin-top:1.5em}blockquote p{padding-left:1em;font-style:italic;font-size:1.2em}aside h2{font-size:1.5em;text-align:left;margin-left:0}aside h3{font-size:1.2em;text-align:left;margin-left:0}nav ol{list-style-type:circle}dt{font-size:1.2em;font-variant:small-caps;margin-top:0.5ex}dd{padding-left:2ex}figcaption,figure{display:block}figure{margin-top:2em;text-align:center}figcaption{font-family:serif;text-align:center;font-style:italic;font-size:0.9em}@media (orientation:landscape){figure.l{display:block;width:50%;max-width:30em;float:left}figure.r{display:block;width:50%;max-width:30em;float:right}}section.st{border:none}section.st div:first-letter{font-weight:bolder}table{border:thin solid;border-spacing:0}caption{font-family:serif;font-style:italic;text-align:center;caption-side:bottom}td,th,tr{border:thin solid}td,th{vertical-align:top;text-align:left;padding:1ex}';
		
		# https://gist.githubusercontent.com/ZhiguoLong/ec9d86ebd0540b8a8631/raw/f90da926368d22935c2b9627ffef76ee9467db08/epub.css
		# $cssData = '@page{margin:10px}a,abbr,acronym,address,applet,article,aside,audio,b,big,blockquote,body,canvas,caption,center,cite,code,del,details,dfn,div,em,embed,fieldset,figcaption,figure,footer,form,h1,h2,h3,h4,h5,h6,header,hgroup,html,i,iframe,img,ins,kbd,label,legend,mark,menu,nav,object,output,p,pre,q,ruby,s,samp,section,small,span,strike,strong,sub,summary,sup,table,tbody,td,tfoot,th,thead,time,tr,tt,u,var,video{margin:0;padding:0;border:0;font-size:100%;vertical-align:baseline}table{border-collapse:collapse;border-spacing:0}dd,dl,dt,li,ol,ul{margin:0;padding:0;border:0;font-size:100%;vertical-align:baseline}body{text-align:justify;line-height:120%}h1{text-indent:0;text-align:center;margin:100px 0 0;font-size:2.0em;font-weight:bold;page-break-before:always;line-height:150%}h2{text-indent:0;text-align:center;margin:50px 0 0;font-size:1.5em;font-weight:bold;page-break-before:always;line-height:135%}h3{text-indent:0;text-align:left;font-size:1.4em;font-weight:bold}h4{text-indent:0;text-align:left;font-size:1.2em;font-weight:bold}h5{text-indent:0;text-align:left;font-size:1.1em;font-weight:bold}h6{text-indent:0;text-align:left;font-size:1.0em;font-weight:bold}h1,h2,h3,h4,h5,h6{-webkit-hyphens:none !important;hyphens:none;page-break-after:avoid;page-break-inside:avoid}p{text-indent:1.25em;margin:0;widows:2;orphans:2}p.centered{text-indent:0;margin:1.0em 0 0;text-align:center}p.centeredbreak{text-indent:0;margin:1.0em 0;text-align:center}p.texttop{margin:1.5em 0 0;text-indent:0}p.clearit{clear:both}p.toctext{margin:0 0 0 1.5em;text-indent:0}p.toctext2{margin:0 0 0 2.5em;text-indent:0}ul{margin:1em 0 0 2em;text-align:left}ol{margin:1em 0 0 2em;text-align:left}span.i{font-style:italic}span.b{font-weight:bold}span.u{text-decoration:underline}span.st{text-decoration:line-through}span.ib{font-style:italic;font-weight:bold}span.iu{font-style:italic;text-decoration:underline}span.bu{font-weight:bold;text-decoration:underline}span.ibu{font-style:italic;font-weight:bold;text-decoration:underline}span.ipadcenterfix{text-align:center}img{max-width:100%}table{margin:1.0em auto}td,th,tr{margin:0;padding:2px;border:1px solid black;font-size:100%;vertical-align:baseline}.footnote{vertical-align:super;font-size:0.75em;text-decoration:none}span.dropcap{font-size:300%;font-weight:bold;height:1em;float:left;margin:0.3em 0.125em -0.4em 0.1em}div.pullquote{margin:2em 2em 0;text-align:left}div.pullquote p{font-weight:bold;font-style:italic}div.pullquote hr{width:100%;margin:0;height:3px;color:#2E8DE0;background-color:#2E8DE0;border:0}div.blockquote{margin:1em 1.5em 0;text-align:left;font-size:0.9em}';

		# https://github.com/mattharrison/epub-css-starter-kit
		$cssData = 'a,abbr,acronym,address,applet,article,aside,audio,b,big,blockquote,body,canvas,caption,center,cite,code,dd,del,details,dfn,div,dl,dt,em,embed,fieldset,figcaption,figure,footer,form,h1,h2,h3,h4,h5,h6,header,hgroup,html,i,iframe,img,ins,kbd,label,legend,mark,menu,nav,object,output,p,pre,q,ruby,s,samp,section,small,span,strike,strong,sub,summary,sup,table,tbody,td,tfoot,th,thead,time,tr,tt,u,var,video{margin-right:0;padding:0;border:0;font-size:100%;vertical-align:baseline}table{border-collapse:collapse;border-spacing:0}@page{margin-top:30px;margin-bottom:20px}div.cover{text-align:center;page-break-after:always;padding:0;margin:0}div.cover img{height:100%;max-width:100%;padding:10px;margin:0;background-color:#cccccc}.half{max-width:50%}.tenth{max-width:10%;width:10%}.cover-img{height:100%;max-width:100%;padding:0;margin:0}h1,h2,h3,h4,h5,h6{hyphens:none !important;-moz-hyphens:none !important;-webkit-hyphens:none !important;adobe-hyphenate:none !important;page-break-after:avoid;page-break-inside:avoid;text-indent:0;text-align:left;font-family:Helvetica, Arial, sans-serif}h1{font-size:1.6em;margin-bottom:3.2em}.title h1{margin-bottom:0;margin-top:3.2em}h2{font-size:1em;margin-top:0.5em;margin-bottom:0.5em}h3{font-size:0.625em}h4{font-size:0.391em}h5{font-size:0.244em}h6{font-size:0.153em}h1 + p,h2 + p,h3 + p,h4 + p,h5 + p,h6 + p{text-indent:0}p{font-family:"Palatino", "Times New Roman", Caecilia, serif;-webkit-hyphens:auto;-moz-hyphens:auto;hyphens:auto;hyphenate-after:3;hyphenate-before:3;hyphenate-lines:2;-webkit-hyphenate-after:3;-webkit-hyphenate-before:3;-webkit-hyphenate-lines:2;line-height:1.5em;margin:0;text-align:justify;text-indent:1em;orphans:2;widows:2}p.first-para,p.first-para-chapter,p.note-p-first{text-indent:0}p.first-para-chapter::first-line{font-variant:small-caps}p.no-indent{text-indent:0}.no-hyphens{hyphens:none !important;-moz-hyphens:none !important;-webkit-hyphens:none !important;adobe-hyphenate:none !important}.rtl{direction:rtl;float:right}.drop{overflow:hidden;line-height:89%;height:0.8em;font-size:281%;margin-right:0.075em;float:left}.dropcap{line-height:100%;font-size:341%;margin-right:0.075em;margin-top:-0.22em;float:left;height:0.8em}dl,ol,ul{margin:1em 0;text-align:left}li{font-family:"Palatino", "Times New Roman", Caecilia, serif;line-height:1.5em;orphans:2;widows:2;text-align:justify;text-indent:0;margin:0}li p{text-indent:0}dt{font-weight:bold;font-family:Helvetica, Arial, sans-serif}dd{line-height:1.5em;font-family:"Palatino", "Times New Roman", Caecilia, serif}dd p{text-indent:0}blockquote{margin-left:1em;margin-right:1em;line-height:1.5em;font-style:italic}blockquote p,blockquote p.first-para{text-indent:0}code,kbd,pre,samp,tt{font-family:"Courier New", Courier, monospace;word-wrap:break-word}pre{font-size:0.8em;line-height:1.2em;margin-left:1em;margin-bottom:1em;white-space:pre-wrap;display:block}img{border-radius:0.3em;-webkit-border-radius:0.3em;-webkit-box-shadow:rgba(0, 0, 0, 0.15) 0 1px 4px;box-shadow:rgba(0, 0, 0, 0.15) 0 1px 4px;box-sizing:border-box;border:white 0.5em solid;max-width:80%;max-height:80%}img.pwhack{width:100%}.group{page-break-inside:avoid}.caption{text-align:center;font-size:0.8em;font-weight:bold}p img{border-radius:0;border:none}figure{padding:1em;background-color:#cccccc;border:1px solid black;text-align:center}figure figcaption{text-align:center;font-size:0.8em;font-weight:bold}div.div-literal-block-admonition{margin-left:1em;background-color:#cccccc}div.hint,div.note,div.tip{margin:1em 0 1em 0 !important;background-color:#cccccc;padding:1em !important;border-top:0 solid #cccccc;border-bottom:0 dashed #cccccc;page-break-inside:avoid}.admonition-title,p.note-title{margin-top:0;font-variant:small-caps;font-size:0.9em;text-align:center;font-weight:bold;font-style:normal;-webkit-hyphens:none;-moz-hyphens:none;hyphens:none}.note-p,div.note p{text-indent:1em;margin-left:0;margin-right:0}div.note p.note-p-first{text-indent:0;margin-left:0;margin-right:0}table{page-break-inside:avoid;border:1px;margin:1em auto;border-collapse:collapse;border-spacing:0}th{font-variant:small-caps;padding:5px !important;vertical-align:baseline;border-bottom:1px solid black}td{font-family:"Palatino", "Times New Roman", Caecilia, serif;font-size:small;hyphens:none;-moz-hyphens:none;-webkit-hyphens:none;padding:5px !important;page-break-inside:avoid;text-align:left;text-indent:0;vertical-align:baseline}td:nth-last-child{border-bottom:1px solid black}.zebra{}.zebra tr th{background-color:white}.zebra tr:nth-child(6n+0),.zebra tr:nth-child(6n+1),.zebra tr:nth-child(6n-1){background-color:#cccccc}sup{vertical-align:super;font-size:0.5em;line-height:0.5em}sub{vertical-align:sub;font-size:0.5em;line-height:0.5em}table.footnote{margin:0.5em 0 0}.footnote{font-size:0.8em}.footnote-link{font-size:0.8em;vertical-align:super}.tocEntry-1 a{font-weight:bold;text-decoration:none;color:black}.tocEntry-2 a{margin-left:1em;text-indent:1em;text-decoration:none;color:black}.tocEntry-3 a{text-indent:2em;text-decoration:none;color:black}.tocEntry-4 a{text-indent:3em;text-decoration:none;color:black}.copyright-top{margin-top:6em}.page-break-before{page-break-before:always}.page-break-after{page-break-after:always}.center{text-indent:0;text-align:center;margin-left:auto;margin-right:auto;display:block}.right{text-align:right}.left{text-align:left}.f-right{float:right}.f-left{float:left}.ingredient{page-break-inside:avoid}.box-example{background-color:#8ae234;margin:2em;padding:1em;border:2px dashed #ef2929}.blue{background-color:blue}.dashed{border:2px dashed #ef2929}.padding-only{padding:1em}.margin-only{margin:2em}.smaller{font-size:0.8em}.em1{font-size:0.5em}.em2{font-size:0.75em}.em3{font-size:1em}.em4{font-size:1.5em}.em5{font-size:2em}.per1{font-size:50%}.per2{font-size:75%}.per3{font-size:100%}.per4{font-size:150%}.per5{font-size:200%}.mousepoem p{line-height:0;margin-left:1em}.per100{font-size:100%;line-height:0.9em}.per90{font-size:90%;line-height:0.9em}.per80{font-size:80%;line-height:0.9em}.per70{font-size:70%;line-height:0.9em}.per60{font-size:60%;line-height:0.9em}.per50{font-size:50%;line-height:1.05em}.per40{font-size:40%;line-height:0.9em}.size1{font-size:x-small}.size2{font-size:small}.size3{font-size:medium}.size4{font-size:large}.size5{font-size:x-large}.stanza{margin-top:1em;font-family:serif;padding-left:1em}.stanza p{padding-left:1em}.poetry{margin:1em}.ln{float:left;color:#999999;font-size:0.8em;font-style:italic}.pos1{margin-left:1em;text-indent:-1em}.pos2{margin-left:2em;text-indent:-1em}.pos3{margin-left:3em;text-indent:-1em}.pos4{margin-left:4em;text-indent:-1em}@font-face{font-family:Inconsolata Mono;font-style:normal;font-weight:normal;src:url("Inconsolata.otf")}.normal-mono{font-family:"Courier New", Courier, monospace}.mono,pre,tt{font-family:"Inconsolata Mono", "Courier New", Courier, monospace;font-style:normal}@font-face{font-family:mgopen modata;font-style:normal;font-weight:normal;font-size:0.5em;src:url("MgOpenModataRegular.ttf")}.modata{font-family:"mgopen modata"}@font-face{font-family:hidden;font-style:normal;font-weight:normal;font-size:1em;src:url("invisible1.ttf")}.hidden-font{font-family:"hidden"}@media (min-width: 200px){.px200{color:#8ae234}}@media (min-width: 400px){.px400{color:#8ae234}}@media (min-width: 800px){.px800{color:#8ae234}}@media (min-width: 1200px){.px1200{color:#8ae234}}* WIP device specific... */* @media (min-width: 768px) and (height: 1024px) and (amzn-kf8) */* Retina iPad */@media amzn-kf8{span.dropcapold{font-size:300%;font-weight:bold;height:1em;float:left;margin:-0.2em 0.1em 0}.dropcap{line-height:100%;font-size:341%;margin-right:0.075em;margin-top:-0.22em;float:left;height:0.8em}}@media amzn-mobi{span.dropcap{font-size:1.5em;font-weight:bold}tt{font-family:"Courier New", Courier, monospace}pre{margin-left:1em;margin-bottom:1em;font-size:x-small;font-family:"Courier New", Courier, monospace;white-space:pre-wrap;display:block}pre .no-indent{margin-left:0;text-indent:0}div.no-indent{margin-left:0;text-indent:0}h1{font-size:2em}h2{font-size:1em}h3{font-size:2em}h4{font-size:1em}blockquote{font-style:italics;margin-left:0;margin-right:0}div.note{border:1px solid black}.note-p,div.note{text-indent:1em;margin-left:0;margin-right:0;font-style:italic}.note-p-first{text-indent:0;margin-left:1em;margin-right:1em}.note-p{text-indent:1em;margin-left:1em;margin-right:1em}.pos1{text-indent:-1em}.pos2{text-indent:-1em}.pos3{text-indent:-1em}.pos4{text-indent:-1em}}.green{color:#8ae234}';

		$log->logLine("Add css");
		$cssPath = $settings['rootPath'] . 'plugins' . DIRECTORY_SEPARATOR . 'ebooks' . DIRECTORY_SEPARATOR . 'booklayouts' . DIRECTORY_SEPARATOR . $ebookdata['layout'] . DIRECTORY_SEPARATOR . 'epub.css';
		if(file_exists($cssPath))
		{
			$log->logLine("Custom CSS found");

			if(!is_readable($cssPath))
			{
				$log->logLine("Custom CSS not readable");
			}
			else
			{
				$cssData = file_get_contents($cssPath);
			}
		}

		$book->addCSSFile("styles.css", "css1", $cssData);

		# A better way is to let EPub handle the image itself, as it may need resizing. Most e-books are only about 600x800
		# pixels, adding mega-pixel images is a waste of place and spends bandwidth. setCoverImage can resize the image.
		# When using this method, the given image path must be the absolute path from the servers Document root.

		if(isset($ebookdata['epubcover']) && file_exists($settings['rootPath'] . $ebookdata['epubcover']) )
		{
			$original = str_replace('/media/live/', '/media/original/', $ebookdata['epubcover']);
			$book->setCoverImage($settings['rootPath'] . $original);
		}

		# setCoverImage can only be called once per book, but can be called at any point in the book creation.
		$log->logLine("Set Cover Image");

		$cover = $content_start . "<h1>" . $ebookdata['title'] . "</h1>\n";
		if(isset($ebookdata['subtitle']) && $ebookdata['subtitle'] != '') { 	$cover .= "<h2>" . $ebookdata['subtitle'] . "</h2>\n"; }
		if(isset($ebookdata['author']) && $ebookdata['author'] != '') { 		$cover .= "<p>" . $ebookdata['author'] . "</p>\n"; }
		if(isset($ebookdata['edition']) && $ebookdata['edition'] != '') { 		$cover .= "<p>" . $ebookdata['edition'] . "</p>\n"; }
		$cover .= $bookEnd;

		$tocName = (isset($ebookdata['epubtocname']) && $ebookdata['epubtocname'] != '' ) ? $ebookdata['epubtocname'] : 'Table of Contents';
		$book->addChapter($tocName, "TOC.xhtml", NULL, false, EPub::EXTERNAL_REF_IGNORE);
		$log->logLine("ToC added");

		$titleName = (isset($ebookdata['epubtitlepage']) && $ebookdata['epubtitlepage'] != '' ) ? $ebookdata['epubtitlepage'] : 'Notices';
		$book->addChapter($titleName, "Cover.xhtml", $cover);
		$log->logLine("Cover added");

		# create the content here
		$log->logLine("Build Chapters");

		$ChapterName 	= (isset($ebookdata['epubchaptername']) && $ebookdata['epubchaptername'] != '' ) ? $ebookdata['epubchaptername'] . ' ' : '';
		$prefix 		= '';
		$prefixNumber	= (isset($ebookdata[epubchapternumber]) && $ebookdata[epubchapternumber]) ? true : false;
		$chapNumArray 	= ['1' => 1]; # initial chapter
		$lastLevel 		= false;
		foreach($bookcontent as $chapter)
		{
			if($lastLevel)
			{
				# increment chapter of current level
				if(isset($chapNumArray[$chapter['level']]))
				{
					$chapNumArray[$chapter['level']]++;		
				}
				# initialise chapter of current level
				else
				{
					# we go one level deeper
					$chapNumArray[$chapter['level']] = 1;

					# that means we add a sub-level
					$book->subLevel();
				}

				# if the current level is smaller than the array of the current chapnumber
				if(count($chapNumArray) > $chapter['level'])
				{
					# then we went up in the hierarchy, so we also cut/shorten the array accordingly...
					$chapNumArray = array_slice($chapNumArray, 0, $chapter['level']);

					# and we adjust the level for the ePub accordingly
					$book->setCurrentLevel($chapter['level']);					
				}
			}
			$lastLevel = $chapter['level'];
			
			$readableChapNum = implode(".", $chapNumArray);

			$filename = "Chapter00";

			if($chapNumArray[1] > 9)
			{
				$filename = "Chapter0";
				if($chapNumArray[1] > 99)
				{
					$filename = "Chapter";
				}
			}
			$filename = $filename . implode("", $chapNumArray) . ".xhtml";

			$chapterHtml = $content_start . $chapter['content'] . $bookEnd;

			if($prefixNumber)
			{
				$prefix = $readableChapNum . ': ';
				if($ChapterName != '')
				{
					$prefix = $ChapterName . " " . $prefix;					
				}
			}

			$book->addChapter($prefix . $chapter['metadata']['meta']['title'], $filename, $chapterHtml, true, EPub::EXTERNAL_REF_ADD);
		}
		
		$book->rootLevel();
		$book->buildTOC($cssFileName = null, $tocCSSClass = "toc", $title = $tocName);

		# Only used in case we need to debug EPub.php.
		if ($book->isLogging && isset($ebookdata['epubdebug']) && $ebookdata['epubdebug'])
		{
			$book->addChapter("Log", "Log.xhtml", $content_start . $log->getLog() . "\n</pre>" . $bookEnd);

		    $book->addChapter("ePubLog", "ePubLog.xhtml", $content_start . $book->getLog() . "\n</pre>" . $bookEnd);
		}

		# Finalize the book, and build the archive.
		$book->finalize(); 

		$filename = preg_replace('/[ \.\?\!\:]/', "-", $ebookdata['title'] . '-' . $ebookdata['edition']);

		# Send the book to the client. ".epub" will be appended if missing.
		$zipData = $book->sendBook($filename);

		# After this point your script should call exit. If anything is written to the output,
		# it'll be appended to the end of the book, causing the epub file to become corrupt.
		exit();
	}

	# we have to flatten field definitions and erase fieldsets
	public function withoutFieldsets($fielddefinitions, $flat)
	{
		foreach($fielddefinitions as $name => $field)
		{
			if($field['type'] == 'fieldset')
			{
				$flat = $this->withoutFieldsets($field['fields'], $flat);
			}
			else
			{
				$flat[$name] = $field;
			}
		}
		return $flat;
	}

	public function generateUuidV4($request, $response, $args)
	{

    	$uuid = sprintf('%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
	    	# 32 bits for "time_low"
      		mt_rand(0, 0xffff), mt_rand(0, 0xffff),
      		
      		#16 bits for "time_mid"
      		mt_rand(0, 0xffff),

      		# 16 bits for "time_hi_and_version",
      		# four most significant bits holds version number 4
      		mt_rand(0, 0x0fff) | 0x4000,

      		# 16 bits, 8 bits for "clk_seq_hi_res",
      		# 8 bits for "clk_seq_low",
      		# two most significant bits holds zero and one for variant DCE1.1
      		mt_rand(0, 0x3fff) | 0x8000,

      		# 48 bits for "node"
      		mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff)
    	);

		return $response->withJson(array('uuid' => $uuid, 'errors' => false), 200);    	
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