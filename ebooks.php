<?php

namespace Plugins\Ebooks;

include 'vendor/autoload.php';

use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Http\Message\ResponseInterface as Response;
use Typemill\Plugin;
use Typemill\Models\Validation;
use Typemill\Models\Navigation;
use Typemill\Models\StorageWrapper;
use Typemill\Extensions\ParsedownExtension;
use Typemill\Events\OnTwigLoaded;
use Typemill\Events\onMetaDefinitionsLoaded;
use Typemill\Events\onSystemnaviLoaded;
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
			'onTwigLoaded'				=> 'onTwigLoaded',			
			'onMetaDefinitionsLoaded'	=> 'onMetaDefinitionsLoaded',
			'onSystemnaviLoaded'		=> 'onSystemnaviLoaded'
		];
	}
	
	public static function addNewRoutes()
	{
		return [
			[
				'httpMethod' 	=> 'get', 
				'route' 		=> '/tm/ebooks', 
				'name' 			=> 'ebooks.show', 
				'class' 		=> 'Typemill\Controllers\ControllerWebSystem:blankSystemPage', 
				'resource' 		=> 'system', 
				'privilege' 	=> 'view'
			],
			[
				'httpMethod' 	=> 'get', 
				'route' 		=> '/api/v1/ebooklayouts', 
				'name' 			=> 'ebooklayouts.get', 
				'class' 		=> 'Plugins\Ebooks\Ebooks:getEbookLayouts', 
				'resource' 		=> 'content', 
				'privilege' 	=> 'create'
			],
			[
				'httpMethod' 	=> 'post', 
				'route' 		=> '/api/v1/ebooklayoutcss', 
				'name' 			=> 'ebooklayoutcss.store', 
				'class' 		=> 'Plugins\Ebooks\Ebooks:storeEbookLayoutCSS', 
				'resource' 		=> 'content', 
				'privilege' 	=> 'create'
			],
			[
				'httpMethod' 	=> 'get', 
				'route' 		=> '/api/v1/ebookprojects', 
				'name' 			=> 'ebookprojects.get', 
				'class' 		=> 'Plugins\Ebooks\Ebooks:getEbookProjects', 
				'resource' 		=> 'system', 
				'privilege' 	=> 'view'
			],
			[
				'httpMethod' 	=> 'post', 
				'route' 		=> '/api/v1/ebookproject', 
				'name' 			=> 'ebookproject.create', 
				'class' 		=> 'Plugins\Ebooks\Ebooks:createEbookProject', 
				'resource' 		=> 'system', 
				'privilege' 	=> 'view'
			],
			[
				'httpMethod' 	=> 'delete', 
				'route' 		=> '/api/v1/ebookproject', 
				'name' 			=> 'ebookdata.delete', 
				'class' 		=> 'Plugins\Ebooks\Ebooks:deleteEbookProject', 
				'resource' 		=> 'system', 
				'privilege' 	=> 'view'
			],
			[
				'httpMethod' 	=> 'get', 
				'route' 		=> '/api/v1/ebookdata', 
				'name' 			=> 'ebookdata.get', 
				'class' 		=> 'Plugins\Ebooks\Ebooks:getEbookData', 
				'resource' 		=> 'system', 
				'privilege' 	=> 'view'
			],
			[
				'httpMethod' 	=> 'post', 
				'route' 		=> '/api/v1/ebookdata', 
				'name' 			=> 'ebookdata.store', 
				'class' 		=> 'Plugins\Ebooks\Ebooks:storeEbookData', 
				'resource' 		=> 'system', 
				'privilege' 	=> 'view'
			],
			[
				'httpMethod' 	=> 'get', 
				'route' 		=> '/api/v1/ebooknavi', 
				'name' 			=> 'ebooknavi.get', 
				'class' 		=> 'Plugins\Ebooks\Ebooks:getEbookNavi', 
				'resource' 		=> 'system', 
				'privilege' 	=> 'view'
			],
			[
				'httpMethod' 	=> 'get', 
				'route' 		=> '/api/v1/ebooknewdraftnavi', 
				'name' 			=> 'ebooknewdraftnavi.get', 
				'class' 		=> 'Plugins\Ebooks\Ebooks:getEbookNewDraftNavi', 
				'resource' 		=> 'system', 
				'privilege' 	=> 'view'
			],
			[
				'httpMethod' 	=> 'get', 
				'route' 		=> '/api/v1/ebooktabdata', 
				'name' 			=> 'ebooktabdata.get', 
				'class' 		=> 'Plugins\Ebooks\Ebooks:getEbookTabData', 
				'resource' 		=> 'content', 'privilege' => 'create'
			],
			[
				'httpMethod' 	=> 'post', 
				'route' 		=> '/api/v1/ebooktabdata', 
				'name' 			=> 'ebooktabdata.store', 
				'class' 		=> 'Plugins\Ebooks\Ebooks:storeEbookTabData', 
				'resource' 		=> 'content', 
				'privilege' 	=> 'create'
			],
			[
				'httpMethod' 	=> 'post', 
				'route' 		=> '/api/v1/ebooktabitem', 
				'name' 			=> 'ebooktabitem.store', 
				'class' 		=> 'Plugins\Ebooks\Ebooks:storeEbookTabItem', 
				'resource' 		=> 'content', 
				'privilege' 	=> 'create'
			],
			[
				'httpMethod' 	=> 'post', 
				'route' 		=> '/api/v1/headlinepreview', 
				'name' 			=> 'headline.preview', 
				'class' 		=> 'Plugins\Ebooks\Ebooks:generateHeadlinePreview', 
				'resource' 		=> 'content', 
				'privilege' 	=> 'create'
			],
			[
				'httpMethod' 	=> 'get', 
				'route' 		=> '/api/v1/epubuuid', 
				'name' 			=> 'epub.uuid', 
				'class' 		=> 'Plugins\Ebooks\Ebooks:generateUuidV4', 
				'resource' 		=> 'content', 
				'privilege' 	=> 'create'
			],
			[
				'httpMethod' 	=> 'get', 
				'route' 		=> '/tm/ebooks/preview', 
				'name' 			=> 'ebook.preview', 
				'class' 		=> 'Plugins\Ebooks\Ebooks:ebookPreview', 
				'resource' 		=> 'content', 
				'privilege' 	=> 'create'
			],
			[
				'httpMethod' 	=> 'get', 
				'route' 		=> '/tm/ebooks/epub', 
				'name' 			=> 'ebook.epub', 
				'class' 		=> 'Plugins\Ebooks\Ebooks:createEpub', 
				'resource' 		=> 'content', 
				'privilege' 	=> 'create'
			],
		];
	}

	# Add ebook-application in pages and settings
	public function onTwigLoaded($metadata)
	{
		$config = $this->getPluginSettings();

		if($this->editorroute)
		{
			if( isset($config['ebooksinpages']) && $config['ebooksinpages'] )
			{
				$this->addJS('/ebooks/public/ebookcomponents.js?20231201');
				$this->addJS('/ebooks/public/ebookinpages.js?20231201');

				# inject thumbindex.js into pages if activated
				if(isset($config['thumbindex']) && $config['thumbindex'])
				{
					$this->addJS('/ebooks/public/thumbindex.js?20231201');
				}
			}
		}
		elseif($this->adminroute && (trim($this->route,"/") == 'tm/ebooks'))
		{
			if( isset($config['ebooksinsettings']) && $config['ebooksinsettings'] )
			{
				$this->addJS('/ebooks/public/ebookinsettings.js?20231201');
				$this->addJS('/ebooks/public/ebookcomponents.js?20231201');
			}
		}
	}

	# Add ebook-item to system navigation
	public function onSystemnaviLoaded($navidata)
	{
		$config = $this->getPluginSettings();

		if(isset($config['ebooksinsettings']) && $config['ebooksinsettings'])
		{
			$this->addSvgSymbol('<symbol id="icon-book" viewBox="0 0 32 32">
				<path d="M28 4v26h-21c-1.657 0-3-1.343-3-3s1.343-3 3-3h19v-24h-20c-2.2 0-4 1.8-4 4v24c0 2.2 1.8 4 4 4h24v-28h-2z"></path>
				<path d="M7.002 26v0c-0.001 0-0.001 0-0.002 0-0.552 0-1 0.448-1 1s0.448 1 1 1c0.001 0 0.001-0 0.002-0v0h18.997v-2h-18.997z"></path>
				</symbol>');

			$navi = $navidata->getData();

			$navi['Ebooks'] = [
				'title' 		=> 'eBooks',
				'routename' 	=> 'ebooks.show', 
				'icon' 			=> 'icon-book', 
				'aclresource' 	=> 'system', 
				'aclprivilege' 	=> 'view'
			];


			# if the use visits the system page of the plugin
			if(trim($this->route,"/") == 'tm/ebooks')
			{
				# set the navigation item active
				$navi['Ebooks']['active'] = true;
			}

			$navidata->setData($navi);
		}
	}

	# Add ebook-tab to pages
	public function onMetaDefinitionsLoaded($metadefinitions)
	{
		$config = $this->getPluginSettings();

		$meta = $metadefinitions->getData();

		$thumbindex = false;

		if(isset($config['ebooksinpages']) && $config['ebooksinpages'] == true)
		{
			# add a tab called "ebook" into pages with no fields, because we will use the fields of the ebook plugin.
			$meta['ebooks'] = ['fields'=> []];

			if(isset($config['thumbindex']) && $config['thumbindex'] == true)
			{
				$thumbindex = true;

				$languageString = $config['languages'];

				# standardize line breaks
				$text = str_replace(array("\r\n", "\r"), "\n", $languageString);

				# remove surrounding line breaks
				$text = trim($text, "\n");

				# split text into lines
				$lines = explode("\n", $text);

				# add values from textarea-field in the settings
				foreach($lines as $line)
				{
					$keyvalue = explode(':', $line);
					if(isset($keyvalue[0]) && isset($keyvalue[1]))
					{
						$languages[trim($keyvalue[0])] = trim($keyvalue[1]);	
					}
				}

				$meta['thumbindex']['fields']['thumbfields']['fields']['language']['options'] = $languages;
			}
		}
		if(!$thumbindex)
		{
			unset($meta['thumbindex']);
		}

		$metadefinitions->setData($meta);
	}


	#################################
	# 		 ebook layouts 			#
	#################################

	# single endpoint to get only the layouts. Not in use right now
	public function getEbookLayouts(Request $request, Response $response, $args)
	{
		$booklayouts = $this->scanEbookLayouts();

		$response->getBody()->write(json_encode([
			'layoutdata' => $booklayouts
		]));

		return $response->withHeader('Content-Type', 'application/json');
	}

	# scans the folder with the ebooklayouts and returns layout-names as array
	private function scanEbooklayouts()
	{
		$settings 		= $this->getSettings();

		# scan the ebooklayouts folder
		$layoutpath 	= __DIR__ . DIRECTORY_SEPARATOR . 'booklayouts';
		$cachepath		= $settings['rootPath'] . DIRECTORY_SEPARATOR . 'cache' . DIRECTORY_SEPARATOR;
		$layoutfolders 	= array_diff(scandir($layoutpath), array('..', '.'));
		$booklayouts 	= [];

		# load the epub forms from ebook.yaml for all layouts
		$ebookconfig 	= file_get_contents(__DIR__ . DIRECTORY_SEPARATOR . 'ebooks.yaml');
		$ebookconfig 	= \Symfony\Component\Yaml\Yaml::parse($ebookconfig);
		$epubforms 		= $ebookconfig['epub'];

		foreach($layoutfolders as $layout)
		{
			# load config files from ebook layout
			$layoutconfig = false;
			if(file_exists($layoutpath . DIRECTORY_SEPARATOR . $layout . DIRECTORY_SEPARATOR . 'config.yaml'))
			{
				$layoutconfig = file_get_contents($layoutpath . DIRECTORY_SEPARATOR . $layout . DIRECTORY_SEPARATOR . 'config.yaml');
				$layoutconfig = \Symfony\Component\Yaml\Yaml::parse($layoutconfig);
			}

			# load customcss
			if(file_exists($cachepath . 'ebooklayout-' . $layout . '-custom.css'))
			{
				$layoutconfig['customcss'] = file_get_contents($cachepath . 'ebooklayout-' . $layout . '-custom.css');
			}

			$booklayouts[$layout] = $layoutconfig;
			$booklayouts[$layout]['epubforms'] = $epubforms;
		}

		return $booklayouts;
	}

	public function storeEbookLayoutCSS(Request $request, Response $response, $args)
	{
		$params 		= $request->getParsedBody();
		$layout 		= $params['layout'] ?? false;
		$css 			= $params['css'] ?? false;
		$css 			= trim($css);
		$settings 		= $this->getSettings();
		$storage 		= new StorageWrapper($settings['storage']);

		if(!$layout OR $layout == '')
		{
			$response->getBody()->write(json_encode([
				'message' => 'Layout name is missing.'
			]));

			return $response->withHeader('Content-Type', 'application/json')->withStatus(404);
		}

		if($css === false)
		{
			$response->getBody()->write(json_encode([
				'message' => 'CSS parameter is missing.'
			]));

			return $response->withHeader('Content-Type', 'application/json')->withStatus(404);
		}

		if($css == '')
		{
			$storage->deleteFile('cacheFolder', '', 'ebooklayout-' . $layout . '-custom.css');

			$response->getBody()->write(json_encode([
				'message' => 'css-file deleted.'
			]));

			return $response->withHeader('Content-Type', 'application/json');
		}

		if($css != strip_tags($css))
		{
			$response->getBody()->write(json_encode([
				'message' => 'css contains html or invalid.'
			]));

			return $response->withHeader('Content-Type', 'application/json')->withStatus(404);
		}

		$result = $storage->writeFile('cacheFolder', '', 'ebooklayout-' . $layout . '-custom.css', $css);

		if(!$result)
		{
			$response->getBody()->write(json_encode([
				'message' 	=> 'We could not store the css-file', 
				'error' 	=> $storage->getError()
			]));

			return $response->withHeader('Content-Type', 'application/json')->withStatus(404);			
		}

		$response->getBody()->write(json_encode([
			'message' 	=> 'CSS successfully stored'
		]));

		return $response->withHeader('Content-Type', 'application/json');
	}

	######################################
	# settings-version: ebook projects 	 #
	######################################

	public function getEbookProjects(Request $request, Response $response, $args)
	{
		$settings 		= $this->getSettings();

		$folderName 	= DIRECTORY_SEPARATOR . 'data' . DIRECTORY_SEPARATOR . 'ebooks';
		$folder 		= $settings['rootPath'] . $folderName;

		if(!$this->checkEbookFolder($folder))
		{
			$response->getBody()->write(json_encode([
				'message' => 'Please make sure that the folder data/ebooks exists and is writable.'
			]));

			return $response->withHeader('Content-Type', 'application/json')->withStatus(422);
		}

		$folderContent = array_diff(scandir($folder), array('..', '.'));
		if(empty($folderContent))
		{
			# create a default project
			$storage 		= new StorageWrapper($settings['storage']);
			$ebookdata 		= $storage->writeFile('dataFolder', 'ebooks', 'ebookdata-firstebook.yaml', '');
			$navigation 	= $storage->writeFile('dataFolder', 'ebooks', 'navigation-firstebook.txt', '');
			$folderContent 	= array_diff(scandir($folder), array('..', '.'));		
		}

		$ebookprojects = [];
		foreach($folderContent as $file)
		{
			if(substr($file,0,9) == 'ebookdata')
			{
				$ebookprojects[] = $file;
			}
		}

		$response->getBody()->write(json_encode([
			'ebookprojects' => $ebookprojects
		]));

		return $response->withHeader('Content-Type', 'application/json');
	}

	private function checkEbookFolder($folder)
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

	public function createEbookProject(Request $request, Response $response, $args)
	{
		$params 		= $request->getParsedBody();
		$settings 		= $this->getSettings();
#		$base_url		= $this->urlinfo['baseurl'];
		$storage 		= new StorageWrapper($settings['storage']);

		if(!isset($params['projectname']) OR $params['projectname'] == '' OR !preg_match("/^[a-z\-]*\.yaml$/", $params['projectname']))
		{
			$response->getBody()->write(json_encode([
				'message' => 'The projectname is not valid.'
			]));

			return $response->withHeader('Content-Type', 'application/json')->withStatus(400);
		}

		$projectname 	= str_replace('.yaml', '', $params['projectname']);
		$projectname 	= str_replace('ebookdata-', '', $projectname);

		$ebookdata 		= $storage->writeFile('dataFolder', 'ebooks', 'ebookdata-' . $projectname . '.yaml', '');
		$navigation 	= $storage->writeFile('dataFolder', 'ebooks', 'navigation-' . $projectname . '.txt', '');

		if(!$ebookdata OR !$navigation)
		{
			$response->getBody()->write(json_encode([
				'message' 		=> 'We could not store the new project.',
				'ebookdata' 	=> $ebookdata,
				'navigation'	=> $navigation,
				'error' 		=> $storage->getError()
			]));

			return $response->withHeader('Content-Type', 'application/json')->withStatus(400);			
		}

		$response->getBody()->write(json_encode([
			'ebookdata' => $ebookdata,
			'navigation' => $navigation
		]));

		return $response->withHeader('Content-Type', 'application/json');
	}

	public function deleteEbookProject(Request $request, Response $response, $args)
	{
		$params 		= $request->getParsedBody();
		$settings 		= $this->getSettings();
#		$base_url		= $this->urlinfo['baseurl'];
		$storage 		= new StorageWrapper($settings['storage']);

		if(!isset($params['projectname']) OR $params['projectname'] == '' OR !preg_match("/^[a-z\-]*\.yaml$/", $params['projectname']))
		{
			$response->getBody()->write(json_encode([
				'message' => 'The projectname is not valid.'
			]));

			return $response->withHeader('Content-Type', 'application/json')->withStatus(400);
		}

		$projectname 	= str_replace('.yaml', '', $params['projectname']);
		$projectname 	= str_replace('ebookdata-', '', $projectname);

		$ebookdata 		= $storage->deleteFile('dataFolder', 'ebooks', 'ebookdata-' . $projectname . '.yaml');
		$navigation 	= $storage->deleteFile('dataFolder', 'ebooks', 'navigation-' . $projectname . '.txt');

		if(!$ebookdata OR !$navigation)
		{
			$response->getBody()->write(json_encode([
				'message' 		=> 'We could not store the new project.',
				'ebookdata' 	=> $ebookdata,
				'navigation'	=> $navigation,
				'error' 		=> $storage->getError()
			]));

			return $response->withHeader('Content-Type', 'application/json')->withStatus(400);			
		}

		$response->getBody()->write(json_encode([
			'ebookdata' => $ebookdata,
			'navigation' => $navigation
		]));

		return $response->withHeader('Content-Type', 'application/json');
	}


	##################################
	# settings-version: ebook data 	 #
	##################################

	public function getEbookData(Request $request, Response $response, $args)
	{
		$projectname 	= $request->getQueryParams()['projectname'] ?? false;

		if(!$projectname OR $projectname == '' OR !preg_match("/^[a-z\-]*\.yaml$/", $projectname))
		{
			$response->getBody()->write(json_encode([
				'message' => 'The projectname is not valid.'
			]));

			return $response->withHeader('Content-Type', 'application/json')->withStatus(400);
		}

		# get the stored ebook-data
		$formdata = $this->getPluginYamlData($projectname);

		$response->getBody()->write(json_encode([
			'formdata' => $formdata
		]));

		return $response->withHeader('Content-Type', 'application/json');
	}

	public function storeEbookData(Request $request, Response $response, $args)
	{
		$params 		= $request->getParsedBody();
		$settings 		= $this->getSettings();
		$layoutpath 	= __DIR__ . DIRECTORY_SEPARATOR . 'booklayouts';
		$storage 		= new StorageWrapper($settings['storage']);

		$data 			= $params['data'] ?? false;
		$navigation 	= $params['navigation'] ?? false; 
		$projectname 	= $params['projectname'] ?? false;
		$layout 		= $params['data']['layout'] ?? false;

		if(
			!$projectname 
			OR $projectname == '' 
			OR !preg_match("/^[a-z\-]*\.yaml$/", $projectname)
			OR !$data
			OR !$layout
		)
		{
			$response->getBody()->write(json_encode([
				'message' => 'Projectname not valid or data empty.'
			]));

			return $response->withHeader('Content-Type', 'application/json')->withStatus(400);
		}

		# load the epub forms from ebook.yaml for all layouts
		$ebookconfig 		= file_get_contents(__DIR__ . DIRECTORY_SEPARATOR . 'ebooks.yaml');
		$ebookconfig 		= \Symfony\Component\Yaml\Yaml::parse($ebookconfig);
		$formdefinitions 	= $ebookconfig['epub']['fields'] ?? [];

		# get the customfield configurations from booklayout folder
		if(file_exists($layoutpath . DIRECTORY_SEPARATOR . $layout . DIRECTORY_SEPARATOR . 'config.yaml'))
		{
			$layoutconfig = file_get_contents($layoutpath . DIRECTORY_SEPARATOR . $layout . DIRECTORY_SEPARATOR . 'config.yaml');
			$layoutconfig = \Symfony\Component\Yaml\Yaml::parse($layoutconfig);

			if(isset($layoutconfig['customforms']['fields']))
			{
				$formdefinitions = array_merge($layoutconfig['customforms']['fields'], $formdefinitions);
			}
		}

		$validate 		= new Validation();
		$data 			= $validate->recursiveValidation($formdefinitions, $data);
		$errors 		= $validate->errors;
		if(!empty($errors))
		{
			$errorstring = 'Errors in fields: ';
			foreach($errors as $field => $error)
			{
				$errorstring .= $field . ', ';
			}

			$errorstring = rtrim(trim($errorstring), ',');

			$response->getBody()->write(json_encode([
				'message' 	=> $errorstring,
				'errors' 	=> $errors
			]));

			return $response->withHeader('Content-Type', 'application/json')->withStatus(400);			
		}

		# add manual field values again
		$data['layout'] 			= $params['data']['layout'];
		$data['disableshortcodes'] 	= $params['data']['disableshortcodes'] ?? false;
		$data['activeshortcodes'] 	= $params['data']['activeshortcodes'] ?? false;
		$data['downgradeheadlines'] = $params['data']['downgradeheadlines'] ?? false;

		# store
		$projectname 	= str_replace('.yaml', '', $projectname);
		$projectname 	= str_replace('ebookdata-', '', $projectname);
		$ebookdata 		= $storage->updateYaml('dataFolder', 'ebooks', 'ebookdata-' . $projectname . '.yaml', $data);
		$navigation 	= $storage->writeFile('dataFolder', 'ebooks', 'navigation-' . $projectname . '.txt', $navigation, 'serialize');

		if(!$ebookdata OR !$navigation)
		{
			$response->getBody()->write(json_encode([
				'message' 		=> 'We could not store the new project.',
				'ebookdata' 	=> $ebookdata,
				'navigation'	=> $navigation,
				'error' 		=> $storage->getError()
			]));

			return $response->withHeader('Content-Type', 'application/json')->withStatus(400);			
		}

		$response->getBody()->write(json_encode([
			'ebookdata' => $ebookdata,
			'navigation' => $navigation
		]));

		return $response->withHeader('Content-Type', 'application/json');
	}

	# gets the ebook navigation from data folder or the general page navigation
	public function getEbookNavi(Request $request, Response $response, $args)
	{
		$projectname 	= $request->getQueryParams()['projectname'] ?? false;

		if(!$projectname OR $projectname == '' OR !preg_match("/^[a-z\-]*\.yaml$/", $projectname))
		{
			$response->getBody()->write(json_encode([
				'message' => 'The projectname is not valid.'
			]));

			return $response->withHeader('Content-Type', 'application/json')->withStatus(400);
		}

		$projectname 	= str_replace('.yaml', '', $projectname);
		$naviname  		= str_replace('ebookdata', 'navigation', $projectname);

		# get the stored ebook-data
		$navigation 	= $this->getPluginData($naviname . '.txt');

		if(!$navigation)
		{
			$navigation = $this->getPluginData('navi-draft.txt', 'navigation');
		}

		if(!$navigation OR trim($navigation) == '')
		{
			$response->getBody()->write(json_encode([
				'message' => 'We did not find a content tree. Please visit the website frontend to generate the tree.'
			]));

			return $response->withHeader('Content-Type', 'application/json')->withStatus(404);
		}

		$response->getBody()->write(json_encode([
			'navigation' => unserialize($navigation)
		]));

		return $response->withHeader('Content-Type', 'application/json');
	}

	# gets the ebook navigation from data folder or the general page navigation
	public function getEbookNewDraftNavi(Request $request, Response $response, $args)
	{
		$navigation 	= new Navigation();
		$urlinfo 		= $this->urlinfo;
		$settings 		= $this->getSettings();
		$langattr 		= $settings['langattr'];

		$draftNavigation = $navigation->getDraftNavigation($urlinfo, $langattr);

		if(!$draftNavigation)
		{
			$response->getBody()->write(json_encode([
				'message' => 'We could not load the content navigation.'
			]));

			return $response->withHeader('Content-Type', 'application/json')->withStatus(404);
		}

		$response->getBody()->write(json_encode([
			'navigation' => $draftNavigation
		]));

		return $response->withHeader('Content-Type', 'application/json');
	}


	##################################
	# 	page-version: ebook data 	 #
	##################################

	# gets the stored ebook-data from page yaml for the ebook-plugin in page tab. We have to do it separately because fields are stripped out in tab.
	public function getEbookTabData(Request $request, Response $response, $args)
	{
		$itempath 		= $request->getQueryParams()['itempath'];
		$settings 		= $this->getSettings();
		$storage 		= new StorageWrapper($settings['storage']);

		if($itempath == '/index')
		{
			$response->getBody()->write(json_encode([
				'home' 		=> true, 
				'message' 	=> "The homepage does not support the ebook generation. Please go to the subpages or use the ebook tab in the settings if you want to create an ebook from the whole website.",
			]));

			return $response->withHeader('Content-Type', 'application/json')->withStatus(422);
		}

		$meta = $storage->getYaml('contentFolder', '', $itempath . '.yaml');

		$formdata = isset($meta['ebooks']) ? $meta['ebooks'] : false;

		# get the ebook layouts
		$booklayouts = $this->scanEbooklayouts();

		$response->getBody()->write(json_encode([
			'formdata' 		=> $formdata,
			'layoutdata' 	=> $booklayouts
		]));

		return $response->withHeader('Content-Type', 'application/json');
	}

	# stores the ebook data from a page tab into the page-yaml
	public function storeEbookTabData(Request $request, Response $response, $args)
	{
		$params 		= $request->getParsedBody();
		$item 			= $params['item'] ?? false;
		$data 			= $params['data'] ?? false;
		$layout 		= $params['data']['layout'] ?? false;
		$layoutpath 	= __DIR__ . DIRECTORY_SEPARATOR . 'booklayouts';

		if(
			!$item 
			OR !$data 
			OR !$layout
		)
		{
			$response->getBody()->write(json_encode([
				'message' => 'Item, data or layout missing.'
			]));

			return $response->withHeader('Content-Type', 'application/json')->withStatus(400);
		}

		$settings 			= $this->getSettings();
		$storage 			= new StorageWrapper($settings['storage']);
		$validate 			= new Validation();

		# load the epub forms from ebook.yaml for all layouts
		$ebookconfig 		= file_get_contents(__DIR__ . DIRECTORY_SEPARATOR . 'ebooks.yaml');
		$ebookconfig 		= \Symfony\Component\Yaml\Yaml::parse($ebookconfig);
		$formdefinitions 	= $ebookconfig['epub']['fields'] ?? [];

		# get the customfield configurations from booklayout folder
		if(file_exists($layoutpath . DIRECTORY_SEPARATOR . $layout . DIRECTORY_SEPARATOR . 'config.yaml'))
		{
			$layoutconfig = file_get_contents($layoutpath . DIRECTORY_SEPARATOR . $layout . DIRECTORY_SEPARATOR . 'config.yaml');
			$layoutconfig = \Symfony\Component\Yaml\Yaml::parse($layoutconfig);

			if(isset($layoutconfig['customforms']['fields']))
			{
				$formdefinitions = array_merge($layoutconfig['customforms']['fields'], $formdefinitions);
			}
		}

		$validate 		= new Validation();
		$data 			= $validate->recursiveValidation($formdefinitions, $data);
		$errors 		= $validate->errors;
		if(!empty($errors))
		{
			$errorstring = 'Errors in fields: ';
			foreach($errors as $field => $error)
			{
				$errorstring .= $field . ', ';
			}

			$errorstring = rtrim(trim($errorstring), ',');

			$response->getBody()->write(json_encode([
				'message' 	=> $errorstring,
				'errors' 	=> $errors
			]));

			return $response->withHeader('Content-Type', 'application/json')->withStatus(400);			
		}

		# add manual field values again
		$data['layout'] 			= $params['data']['layout'];
		$data['disableshortcodes'] 	= $params['data']['disableshortcodes'] ?? false;
		$data['activeshortcodes'] 	= $params['data']['activeshortcodes'] ?? false;
		$data['downgradeheadlines'] = $params['data']['downgradeheadlines'] ?? false;
		$data['excludebasefolder'] 	= $params['data']['excludebasefolder'] ?? false;
		$data['content'] 			= $params['data']['content'] ?? false;

		# get the metadata from page
		$meta = $storage->getYaml('contentFolder', '', $itempath . '.yaml');

		# add the tab-data for ebooks
		$meta['ebooks'] = $data;

		# store the metadata for page 
		$storage->updateYaml('contentFolder', '', $item['pathWithoutType'] . '.yaml', $meta);

		$response->getBody()->write(json_encode([
			"ebookdata" => $meta['ebooks']
		]));

		return $response->withHeader('Content-Type', 'application/json');
	}

	# stores the navigation for the ebook from a tab into a temporary file
	public function storeEbookTabItem(Request $request, Response $response, $args)
	{
		$params 		= $request->getParsedBody();
		$item 			= $params['item'];

		if(!$item)
		{
			$response->getBody()->write(json_encode([
				'message' 	=> 'Item is missing'
			]));

			return $response->withHeader('Content-Type', 'application/json')->withStatus(400);
		}

		$tmpitem 		= $this->storePluginData('tmpitem.txt', serialize($item));
		
		if($tmpitem !== true)
		{
			$response->getBody()->write(json_encode([
				'message' 	=> $tmpitem
			]));

			return $response->withHeader('Content-Type', 'application/json')->withStatus(400);
		}

		$response->getBody()->write(json_encode([
			"tmpitem" => $tmpitem
		]));

		return $response->withHeader('Content-Type', 'application/json');
	}




	#################################
	# 		headlines and uuid 	 	#
	#################################

	# generate a headline preview of the current content selection
	public function generateHeadlinePreview(Request $request, Response $response, $args)
	{
		$params 		= $request->getParsedBody();
		$settings 		= $this->getSettings();
		$base_url		= $this->urlinfo['baseurl'];

		# check if call comes from a tab
		if(isset($params['item']) && isset($params['ebookdata']))
		{
			$ebookdata 	= $params['ebookdata'];

			$navigation = $params['item'];
		}
		# otherwise it is from the settings
		else
		{
			return false;
			# get bookdata
#			$ebookdata 	= $writeYaml->getYaml($ebookFolderName, 'ebookdata.yaml');

			# get navigationdata
#			$navigation = $writeCache->getCache($ebookFolderName, 'navigation.txt');
		}

		# skip the base folder if activated
		if(isset($ebookdata['excludebasefolder']) and $ebookdata['excludebasefolder'] and isset($navigation[0]['folderContent']))
		{
			$navigation = $navigation[0]['folderContent'];
		}

		# generate the book content from ebook-navigation
		$parsedown 		= new ParsedownExtension($base_url);

# GET THAT FROM STORAGE
		$pathToContent	= $settings['rootPath'] . DIRECTORY_SEPARATOR . 'content';

		$headlines 		= $this->generateArrayOfHeadlineElements([], $navigation, $pathToContent, $parsedown, $ebookdata);

		if(empty($headlines))
		{
			$headlines[] 	= [
				'name' 		=> 'ERROR',
				'level' 	=> 1,
				'text' 		=> 'No headlines found. That page might not exist anymore. Please load the latest content tree.'
			]; 
		}

		$response->getBody()->write(json_encode([
			'headlines' => $headlines
		]));

		return $response->withHeader('Content-Type', 'application/json');
	}

	private function generateArrayOfHeadlineElements($headlines, $navigation, $pathToContent, $parsedown, $ebookdata, $chapterlevel = NULL)
	{
		$downgradeheadlines 		= isset($ebookdata['downgradeheadlines']) ? $ebookdata['downgradeheadlines'] : 0;
		$chapterlevel				= $chapterlevel ? $chapterlevel : 1;

		foreach($navigation as $item)
		{

# OPTION FOR UNPUBLISHED AND DRAFTED PAGES

			if(
				$item['status'] == "published" &&
				isset($item['include']) &&
				$item['include'] == true
			)
			{
				# set the filepath
				$filePath 	= $item['path'];
				$metaPath 	= $pathToContent . $item['pathWithoutType'] . '.yaml';
				
				# check if url is a folder and add index.md 
				if($item['elementType'] == 'folder')
				{
					$filePath 	= $filePath . DIRECTORY_SEPARATOR . 'index.md';
				}
				
				# get the meta
				$meta 				= file_exists($metaPath) ? file_get_contents($metaPath) : false;
				if($meta)
				{
					$meta 			= \Symfony\Component\Yaml\Yaml::parse($meta);

					# check for references
					if(isset($meta['meta']['referencetype']) && $meta['meta']['referencetype'] == 'copy')
					{
						$filePath = $this->getFilepathForReference($meta, $filePath);
					}
				}

				$filePath = $pathToContent . $filePath;

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

	public function generateUuidV4(Request $request, Response $response, $args)
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

		$response->getBody()->write(json_encode([
			'uuid' => $uuid
		]));

		return $response->withHeader('Content-Type', 'application/json');
	}


	##########################################
	# eBook Generation (pdf-preview / epub)  #
	##########################################

	# generates the ebook-preview
	public function ebookPreview(Request $request, Response $response, $args)
	{
		$projectname 	= $request->getQueryParams()['projectname'] ?? false;
		$itempath 		= $request->getQueryParams()['itempath'] ?? false;
		$settings 		= $this->getSettings();
		$baseurl 		= $this->urlinfo['baseurl'];
		$dispatcher 	= $this->getDispatcher();

		# if it is from the settings
		if($projectname)
		{
			$projectname 	= str_replace('.yaml', '', $projectname);
			$naviname  		= str_replace('ebookdata', 'navigation', $projectname);

			# get bookdata
			$ebookdata 		= $this->getPluginYamlData($projectname . '.yaml');
			if(!$ebookdata)
			{
				$response->getBody()->write(json_encode([
					'message' => 'We did not find a content tree. Please visit the website frontend to generate the tree.'
				]));

				return $response->withHeader('Content-Type', 'application/json')->withStatus(404);
			}

			# get the stored ebook-navigation
			$navigation 	= $this->getPluginData($naviname . '.txt');
			if(!$navigation OR trim($navigation) == '')
			{
				$response->getBody()->write(json_encode([
					'message' => 'We did not find a content tree. Please visit the website frontend to generate the tree.'
				]));

				return $response->withHeader('Content-Type', 'application/json')->withStatus(404);
			}

			$navigation = unserialize($navigation);
		}
		elseif($itempath)
		{
			# wait for a second to make super sure that the temporary item has been stored by vue-script
			usleep(200000);

			$storage 	= new StorageWrapper($settings['storage']);
			
			# get the metadata from page
			$meta 		= $storage->getYaml('contentFolder', '', $itempath . '.yaml');
			$ebookdata 	= isset($meta['ebooks']) ? $meta['ebooks'] : false;

			$navigation = $this->getPluginData('tmpitem.txt');
			if(!$navigation OR trim($navigation) == '')
			{
				$response->getBody()->write(json_encode([
					'message' => 'We could not find the navigation for the eBook. Please make sure that you selected some pages for this book.'
				]));

				return $response->withHeader('Content-Type', 'application/json')->withStatus(404);
			}

			$navigation = unserialize($navigation);			
		}

		# setup parsedown with individual settings
		$parsedown = new ParsedownExtension($baseurl, $settingsForHeadlineAnchors = false, $dispatcher);
		
		# disable attributes for images because of bug in pagedjs
#		$parsedown->withoutImageAttributes();
		
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

		$pathToContent	= $settings['rootPath'] . DIRECTORY_SEPARATOR . 'content';
		$bookcontent 	= $this->generateContent([], $navigation, $pathToContent, $parsedown, $ebookdata);

		# let us add the thumb index:
		$thumbindex 	= [];

		foreach($bookcontent as $chapter)
		{
			if( isset($chapter['metadata']['thumbindex']['language']) && ($chapter['metadata']['thumbindex']['language'] != 'clear'))
			{
				$lang 	= $chapter['metadata']['thumbindex']['language'];
				$thumb 	= $chapter['metadata']['thumbindex']['thumb'] ?? false;
				$thumbindex[$lang] = [
					'lang' 	=> $lang, 
					'thumb' => $thumb 
				];
			}
		}

		# we have to dispatch onTwigLoaded to get javascript from other plugins
		$dispatcher->dispatch(new OnTwigLoaded(false), 'onTwigLoaded');

		$twig   		= $this->getTwig();
		$loader 		= $twig->getLoader();
		$loader->addPath(__DIR__ . '/templates', 'ebooks');
		$loader->addPath(__DIR__ . '/booklayouts/' . $ebookdata['layout'], 'booklayouts');
	
		$booklayouts = $this->scanEbooklayouts();

		/*
		# load customcss
		$customcss = $writeYaml->checkFile('cache', 'ebooklayout-' . $ebookdata['layout'] . '-custom.css');
		if($customcss)
		{
			$this->container->assets->addCSS($base_url . '/cache/ebooklayout-' . $ebookdata['layout'] . '-custom.css');
		}
		*/

		return $twig->render($response, '@booklayouts/index.twig', [
			'settings' 		=> $settings, 
			'base_url' 		=> $baseurl, 			
			'ebookdata' 	=> $ebookdata, 
			'booklayout'	=> $booklayouts[$ebookdata['layout']],
			'book' 			=> $bookcontent,
			'thumbindex'	=> $thumbindex
		]);
	}


	# generates and returns the epub file
	public function createEpub(Request $request, Response $response, $args)
	{
		ob_end_flush();

		error_reporting(E_ALL | E_STRICT);
		ini_set('error_reporting', E_ALL | E_STRICT);
		ini_set('display_errors', 0);
		
		$projectname 	= $request->getQueryParams()['projectname'];
		$itempath 		= $request->getQueryParams()['itempath'];
		$settings 		= $this->getSettings();
		$baseurl 		= $this->urlinfo['baseurl'];

		# if it is from the settings
		if($projectname)
		{
			$projectname 	= str_replace('.yaml', '', $projectname);
			$naviname  		= str_replace('ebookdata', 'navigation', $projectname);

			# get bookdata
			$ebookdata 		= $this->getPluginYamlData($projectname . '.yaml');
			if(!$ebookdata)
			{
				$response->getBody()->write(json_encode([
					'message' => 'We did not find a content tree. Please visit the website frontend to generate the tree.'
				]));

				return $response->withHeader('Content-Type', 'application/json')->withStatus(404);
			}

			# get the stored ebook-navigation
			$navigation 	= $this->getPluginData($naviname . '.txt');
			if(!$navigation OR trim($navigation) == '')
			{
				$response->getBody()->write(json_encode([
					'message' => 'We did not find a content tree. Please visit the website frontend to generate the tree.'
				]));

				return $response->withHeader('Content-Type', 'application/json')->withStatus(404);
			}

			$navigation = unserialize($navigation);
		}
		elseif($itempath)
		{
			# wait for a second to make super sure that the temporary item has been stored by vue-script
			usleep(200000);

			$storage 	= new StorageWrapper($settings['storage']);
			
			# get the metadata from page
			$meta 		= $storage->getYaml('contentFolder', '', $itempath . '.yaml');
			$ebookdata 	= isset($meta['ebooks']) ? $meta['ebooks'] : false;

			$navigation = $this->getPluginData('tmpitem.txt');
			if(!$navigation OR trim($navigation) == '')
			{
				$response->getBody()->write(json_encode([
					'message' => 'We could not find the navigation for the eBook. Please make sure that you selected some pages for this book.'
				]));

				return $response->withHeader('Content-Type', 'application/json')->withStatus(404);
			}

			$navigation = unserialize($navigation);			
		}

		# setup parsedown with individual settings
		$parsedown = new ParsedownExtension($baseurl);

		$parsedown->withSpanFootnotes();

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

		$pathToContent	= $settings['rootPath'] . DIRECTORY_SEPARATOR . 'content';
		$bookcontent 	= $this->generateContent([], $navigation, $pathToContent, $parsedown, $ebookdata);


		##############
		# START EPUB #
		##############


		# setting timezone for time functions used for logging to work properly
		date_default_timezone_set('Europe/Berlin');
		$log = new Logger("eBook Log", TRUE);

#		$fileDir = './PHPePub';
		$fileDir = '.';
		$fileDir = $settings['rootPath'];
		
		# ePub 3 is not fully implemented. but aspects of it is, in order to help implementers.
		# ePub 3 uses HTML5, formatted strictly as if it was XHTML but still using just the HTML5 doctype (aka XHTML5)
		$book = new EPub(EPub::BOOK_VERSION_EPUB3, "en", EPub::DIRECTION_LEFT_TO_RIGHT); // Default is ePub 2
		$log->logLine("new EPub()");
		$log->logLine("EPub class version.: " . EPub::VERSION);
		$log->logLine("Zip version........: " . Zip::VERSION);
		$log->logLine("getCurrentServerURL: " . URLHelper::getCurrentServerURL());
		$log->logLine("getCurrentPageURL..: " . URLHelper::getCurrentPageURL());

		if(!isset($ebookdata['epubtitle']) OR $ebookdata['epubtitle'] == '')
		{
			$response->getBody()->write('The ePub title is missing.');
			
			return $response->withStatus(422);
		}

		# Title and Identifier are mandatory!
		$book->setTitle($ebookdata['epubtitle']);
		
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
## use input field for publishing date
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
		CalibreHelper::setCalibreMetadata($book, $ebookdata['epubtitle'], "3");

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

		$log->logLine("Add css");

		$cssData = '';
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
		else
		{
			# add standard epub css
			$cssPath = $settings['rootPath'] . 'plugins' . DIRECTORY_SEPARATOR . 'ebooks' . DIRECTORY_SEPARATOR . 'epubcss' . DIRECTORY_SEPARATOR . 'epub-starter-kit.css';		
			$cssData = file_get_contents($cssPath);
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

		# Create the cover
		$cover = $content_start . "<h1>" . $ebookdata['epubtitle'] . "</h1>\n";
		if(isset($ebookdata['epubsubtitle']) && $ebookdata['epubsubtitle'] != '')
		{ 	
			$cover .= "<h2>" . $ebookdata['epubsubtitle'] . "</h2>\n";
		}
		if(isset($ebookdata['epubauthor']) && $ebookdata['epubauthor'] != '')
		{
			$cover .= "<p>" . $ebookdata['epubauthor'] . "</p>\n"; 
		}
		$cover .= $bookEnd;

		$tocName = (isset($ebookdata['epubtocname']) && $ebookdata['epubtocname'] != '' ) ? $ebookdata['epubtocname'] : 'Table of Contents';
		$book->addChapter($tocName, "TOC.xhtml", NULL, false, EPub::EXTERNAL_REF_IGNORE);
		$log->logLine("ToC added");

		$titleName = (isset($ebookdata['epubtitlepage']) && $ebookdata['epubtitlepage'] != '' ) ? $ebookdata['epubtitlepage'] : 'Notices';
		$book->addChapter($titleName, "Cover.xhtml", $cover);
		$log->logLine("Cover added");

		if(isset($ebookdata['epubimprint']) && $ebookdata['epubimprint'] != '')
		{
			$imprinttitle  	= (isset($ebookdata['epubimprinttitle']) && $ebookdata['epubimprinttitle'] != '') ? $ebookdata['epubimprinttitle'] : 'Imprint';
			$imprintarray 	= $parsedown->text($ebookdata['epubimprint'], $itemUrl = false);
			$imprinthtml 	= $parsedown->markup($imprintarray, $itemUrl = false);

			$imprint = $content_start;
			$imprint .= "<h1>" . $imprinttitle . "</h1>";
			$imprint .= $imprinthtml;
			$imprint .= $bookEnd;

			$book->addChapter($imprinttitle, "Imprint.xhtml", $imprint);

			# create the content here
			$log->logLine("Imprint added");
		}

		# create the content here
		$log->logLine("Build Chapters");

		$ChapterName 	= (isset($ebookdata['epubchaptername']) && $ebookdata['epubchaptername'] != '' ) ? $ebookdata['epubchaptername'] . ' ' : '';
		$prefix 		= '';
		$prefixNumber	= (isset($ebookdata['epubchapternumber']) && $ebookdata['epubchapternumber']) ? true : false;
		$chapNumArray 	= ['0' => 1]; # initial chapter
		$lastLevel 		= false;

		foreach($bookcontent as $chapter)
		{
			if($lastLevel)
			{
				# we have to reduce by 1 so we find the correct key in chapNumArray starting with 0
				$chapterKey = $chapter['level']-1;
				
				# if we are in the same level
				if( ($chapter['level'] == $lastLevel) ) 
				{
					if(!isset($chapNumArray[$chapterKey]))
					{
						print_r($chapNumArray);
						die('the chapnum level . ' . $chapter['level'] . ' does not exist.' );
					}

					# increment
					$chapNumArray[$chapterKey]++;
				}
				# if we went one level deeper in the hierarchy
				elseif($chapter['level'] > $lastLevel)
				{
					if(isset($chapNumArray[$chapterKey]))
					{
						print_r($chapNumArray);
						die('the chapnum level . ' . $chapter['level'] . ' already exists.' );
					}

					# we initialize the deeper level with 1
					$chapNumArray[$chapterKey] = 1;

					# that means we add a sub-level
					$book->subLevel();
				}
				# if we went one level up in the hierarchy
				elseif($chapter['level'] < $lastLevel)
				{
					# we cut/shorten the chapNumArray accordingly...
					$chapNumArray = array_slice($chapNumArray, 0, $chapter['level']);

					# and we increment the current chapter level
					$chapNumArray[$chapterKey]++;

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


			/**
			 * Add a chapter to the book, as a chapter should not exceed 250kB, you can parse an array with multiple parts as $chapterData.
			 * These will still only show up as a single chapter in the book TOC.
			 *
			 * @param string $chapterName        Name of the chapter, will be use din the TOC
			 * @param string $fileName           Filename to use for the chapter, must be unique for the book.
			 * @param string $chapterData        Chapter text in XHTML or array $chapterData valid XHTML data for the chapter. File should NOT exceed 250kB.
			 * @param bool   $autoSplit          Should the chapter be split if it exceeds the default split size? Default=FALSE, only used if $chapterData is a string.
			 * @param int    $externalReferences How to handle external references, EPub::EXTERNAL_REF_IGNORE, EPub::EXTERNAL_REF_ADD or EPub::EXTERNAL_REF_REMOVE_IMAGES? See documentation for <code>processChapterExternalReferences</code> for explanation. Default is EPub::EXTERNAL_REF_IGNORE.
			 * @param string $baseDir            Default is "", meaning it is pointing to the document root. NOT used if $externalReferences is set to EPub::EXTERNAL_REF_IGNORE.
			 *
			 * @return mixed $success            FALSE if the addition failed, else the new NavPoint.
			 */

			/**
			 * Process external references from a HTML to the book. The chapter itself is not stored.
			 * the HTML is scanned for &lt;link..., &lt;style..., and &lt;img tags.
			 * Embedded CSS styles and links will also be processed.
			 * Script tags are not processed, as scripting should be avoided in e-books.
			 *
			 * EPub keeps track of added files, and duplicate files referenced across multiple
			 *  chapters, are only added once.
			 *
			 * If the $doc is a string, it is assumed to be the content of an HTML file,
			 *  else is it assumes to be a DOMDocument.
			 *
			 * Basedir is the root dir the HTML is supposed to "live" in, used to resolve
			 *  relative references such as <code>&lt;img src="../images/image.png"/&gt;</code>
			 *
			 * $externalReferences determines how the function will handle external references.
			 *
			 * @param mixed  &$doc               (referenced)
			 * @param int    $externalReferences How to handle external references, EPub::EXTERNAL_REF_IGNORE, EPub::EXTERNAL_REF_ADD or EPub::EXTERNAL_REF_REMOVE_IMAGES? Default is EPub::EXTERNAL_REF_ADD.
			 * @param string $baseDir            Default is "", meaning it is pointing to the document root.
			 * @param string $htmlDir            The path to the parent HTML file's directory from the root of the archive.
			 *
			 * @return bool  false if unsuccessful (book is finalized or $externalReferences == EXTERNAL_REF_IGNORE).
			 */

			$book->addChapter(
				$chapterName 			= $prefix . $chapter['metadata']['meta']['title'], 
				$fileName 				= $filename,
				$chapterData 			= $chapterHtml,
				$autoSplit 				= true,
				$externalReferences 	= EPub::EXTERNAL_REF_ADD
			);
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

		$filename = preg_replace('/[ \.\?\!\:]/', "-", $ebookdata['title']);

		# Send the book to the client. ".epub" will be appended if missing.
		$zipData = $book->sendBook($filename);

		# After this point your script should call exit. If anything is written to the output,
		# it'll be appended to the end of the book, causing the epub file to become corrupt.
		exit();
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
				if(!isset($item['include']) OR $item['include'] != true)
				{
					continue;
				}

				# set the filepath
				$filePath 	= $item['path'];
				$metaPath 	= $pathToContent . $item['pathWithoutType'] . '.yaml';
				
				# check if url is a folder and add index.md 
				if($item['elementType'] == 'folder')
				{
					$filePath 	= $filePath . DIRECTORY_SEPARATOR . 'index.md';
				}
				
				# get the meta
				$meta 				= file_exists($metaPath) ? file_get_contents($metaPath) : false;
				if($meta)
				{
					$meta 			= \Symfony\Component\Yaml\Yaml::parse($meta);
				
					# check for references
					if(isset($meta['meta']['referencetype']) && $meta['meta']['referencetype'] == 'copy')
					{
						$filePath = $this->getFilepathForReference($meta, $filePath);
					}
				}

				$filePath = $pathToContent . $filePath;

				# read the content of the file
				$chapter 			= file_exists($filePath) ? file_get_contents($filePath) : false;

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

	private function getFilepathForReference($meta, $filepath)
	{
		$urlinfo 			= $this->urlinfo;
		$settings 			= $this->getSettings();
		$langattr 			= $settings['langattr'];

		$navigation 		= new Navigation();

		$draftNavigation 	= $navigation->getDraftNavigation($urlinfo, $langattr);

		$findurl 			= trim($meta['meta']['reference'], '/');
		$findurl 			= '/' . $findurl;

		$referenceItem 		= $navigation->getItemWithUrl($draftNavigation, $findurl);

		if($referenceItem)
		{
			$filepath = $referenceItem->path;
		}

		return $filepath;		
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
}