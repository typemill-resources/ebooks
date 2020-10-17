<?php

namespace Plugins\Ebooks;

use Typemill\Plugin;
use Typemill\Models\WriteYaml;
use Typemill\Models\WriteCache;
use Typemill\Extensions\ParsedownExtension;
use Valitron\Validator;

class Ebooks extends Plugin
{
    public static function getSubscribedEvents()
    {
		return [
			'onSystemnaviLoaded'	=> ['onSystemnaviLoaded',0],
			'onPageReady'			=> ['onPageReady',0],
		];
    }
	
	public static function addNewRoutes()
	{
		return [
			['httpMethod' => 'get', 'route' => '/tm/ebooks', 'name' => 'ebooks.show', 'class' => 'Typemill\Controllers\SettingsController:showBlank', 'resource' => 'system', 'privilege' => 'view'],
			['httpMethod' => 'get', 'route' => '/api/v1/ebookdata', 'name' => 'ebook.get', 'class' => 'Plugins\Ebooks\Ebooks:getEbookData', 'resource' => 'system', 'privilege' => 'view'],
			['httpMethod' => 'post', 'route' => '/api/v1/ebookdata', 'name' => 'ebook.store', 'class' => 'Plugins\Ebooks\Ebooks:storeEbookData', 'resource' => 'system', 'privilege' => 'view'],
			['httpMethod' => 'get', 'route' => '/api/v1/ebooknavi', 'name' => 'ebooknavi.get', 'class' => 'Plugins\Ebooks\Ebooks:getEbookNavi', 'resource' => 'system', 'privilege' => 'view'],
			['httpMethod' => 'get', 'route' => '/tm/ebooks/preview', 'name' => 'ebook.preview', 'class' => 'Plugins\Ebooks\Ebooks:ebookPreview', 'resource' => 'system', 'privilege' => 'view'],
		];
	}

	public function onSystemnaviLoaded($navidata)
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

	public function onPageReady($data)
	{
		if(strpos($this->getPath(), 'tm/ebooks') !== false)
		{

			# add the css and vue application
		    $this->addCSS('/ebooks/public/ebooks.css');
		    $this->addJS('/ebooks/public/ebooks.js');
			
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
		$ebookdata = $writeYaml->getYaml($folderName, 'ebookdata.yaml');

		# scan the ebooklayouts folder
		$layoutfolders = array_diff(scandir(__DIR__ . '/booklayouts'), array('..', '.'));
		$booklayouts = [];

		foreach($layoutfolders as $layout)
		{
			$configfolder = 'plugins' . DIRECTORY_SEPARATOR . 'ebooks' . DIRECTORY_SEPARATOR . 'booklayouts' . DIRECTORY_SEPARATOR . $layout;
			$bookconfig = $writeYaml->getYaml($configfolder, 'config.yaml');
			$booklayouts[$layout] = $bookconfig;
		}

		$ebookdata['booklayouts'] = $booklayouts;

		$ebookdata = json_encode($ebookdata, JSON_FORCE_OBJECT); # convert array to object so vue can wwork with it

		return $response->withJson(array('data' => $ebookdata, 'errors' => false), 200);
	}

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

		$navigation = $writeCache->getCache($folderName, 'navigation.txt');

		return $response->withJson(array('data' => $navigation, 'errors' => false), 200);
	}

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

		# validate here
		$v = new Validator($params['data']);

		$v->rule('required', ['title', 'author']);
		$v->rule('lengthMax', 'title', 80);
		$v->rule('lengthMax', 'subtitle', 80);
		$v->rule('lengthMax', 'author', 80);
		$v->rule('lengthMax', 'edition', 80);
		$v->rule('lengthMax', 'imprint', 1500);
		$v->rule('lengthMax', 'dedication', 1500);
		$v->rule('lengthMax', 'blurb', 1500);
		$v->rule('lengthMax', 'primarycolor', 20);
		$v->rule('lengthMax', 'secondarycolor', 20);

		$contenterror = false; 

		if(!isset($params['navigation']) OR empty($params['navigation']) OR !$params['navigation'])
		{
			$contenterror = ['Content is missing'];
		}

		if(!$v->validate() OR $contenterror)
		{
			$errors = $v->errors();

			if($contenterror)
			{
				$errors['content'] = $contenterror;
			}

			return $response->withJson(array('errors' => $errors), 422);
		}

		# write params
		$writeYaml 			= new WriteYaml();
		$writeCache 		= new WriteCache();

		$ebookstored = $writeYaml->updateYaml($folderName, 'ebookdata.yaml', $params['data']);
		$navistored = $writeCache->updateCache($folderName, 'navigation.txt', false, $params['navigation']);
		
		if($ebookstored AND $navistored)
		{
			return $response->withJson(array("ebookdata" => $ebookstored, "navidata" => $navistored), 200);
		}

		return $response->withJson(array('data' => false, 'errors' => ['message' => 'We could not store all data. Please try again.']), 500);
	}

	public function ebookPreview($request, $response, $args)
	{
		$settings 		= $this->getSettings();

		$folderName 	= 'data' . DIRECTORY_SEPARATOR . 'ebooks';
		$folder 		= $settings['rootPath'] . $folderName;

		# get bookdata
		$writeYaml 	= new WriteYaml();
		$ebookdata = $writeYaml->getYaml($folderName, 'ebookdata.yaml');

		# get navigationdata
		$writeCache = new WriteCache();
		$navigation = $writeCache->getCache($folderName, 'navigation.txt');

		$settings		= $this->getSettings();
		$pathToContent	= $settings['rootPath'] . $settings['contentFolder'];
		$parsedown 		= new ParsedownExtension();

		$book = $this->generateContent([], $navigation, $pathToContent, $parsedown);

		$twig   = $this->getTwig();
		$loader = $twig->getLoader();
		$loader->addPath(__DIR__ . '/templates', 'ebooks');
		$loader->addPath(__DIR__ . '/booklayouts/' . $ebookdata['layout'], 'booklayouts');
	
		return $twig->render($response, '@booklayouts/index.twig', [
			'settings' => $settings, 
			'ebookdata' => $ebookdata, 
			'book' => $book]);
	}

	public function generateContent($book, $navigation, $pathToContent, $parsedown)
	{
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

				# correct the headline hierarchy according to its position  on the website
				$chapterlevel = count($item['keyPathArray']);
				if($chapterlevel > 1)
				{
					# go through each content element
					foreach($chapterArray as $key => $element)
					{
						# lower the levels of headlines
						if(isset($element['name'][1]) AND $element['name'][0] == 'h' AND is_numeric($element['name'][1]))
						{
							$headlinelevel = $element['name'][1] + ($chapterlevel -1);
							$headlinelevel = ($headlinelevel > 6) ? 6 : $headlinelevel;
							$chapterArray[$key]['name'] = 'h' . $headlinelevel;
						}
					}
				}

				# turn into html
				$chapterHTML		= $parsedown->markup($chapterArray, $itemUrl = false);

				$book[] = ['item' => $item, 'level' => $chapterlevel, 'content' => $chapterHTML];

				if($item['elementType'] == 'folder')
				{
					$book 	= $this->generateContent($book, $item['folderContent'], $pathToContent, $parsedown);
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