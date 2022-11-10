/**
 * Licensed to the Apache Software Foundation (ASF) under one or more
 * contributor license agreements.  See the NOTICE file distributed with
 * this work for additional information regarding copyright ownership.
 * The ASF licenses this file to You under the Apache License, Version 2.0
 * (the "License"); you may not use this file except in compliance with
 * the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
  typeof define === 'function' && define.amd ? define(['exports'], factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global["apache-unomi-tracker"] = {}));
})(this, (function (exports) { 'use strict';

  function _typeof(obj) {
    "@babel/helpers - typeof";

    return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) {
      return typeof obj;
    } : function (obj) {
      return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
    }, _typeof(obj);
  }

  class Provider$3 {
    constructor() {}

    getAll() {
      return this.data;
    }
  }

  var provider = Provider$3;

  const Provider$2 = provider;

  class Crawlers$1 extends Provider$2 {
    constructor() {
      super();

      this.data = [
        ' YLT',
        '^Aether',
        '^Amazon Simple Notification Service Agent$',
        '^Amazon-Route53-Health-Check-Service',
        '^b0t$',
        '^bluefish ',
        '^Calypso v\\/',
        '^COMODO DCV',
        '^Corax',
        '^DangDang',
        '^DavClnt',
        '^DHSH',
        '^docker\\/[0-9]',
        '^Expanse',
        '^FDM ',
        '^git\\/',
        '^Goose\\/',
        '^Grabber',
        '^Gradle\\/',
        '^HTTPClient\\/',
        '^HTTPing',
        '^Java\\/',
        '^Jeode\\/',
        '^Jetty\\/',
        '^Mail\\/',
        '^Mget',
        '^Microsoft URL Control',
        '^Mikrotik\\/',
        '^Netlab360',
        '^NG\\/[0-9\\.]',
        '^NING\\/',
        '^npm\\/',
        '^Nuclei',
        '^PHP-AYMAPI\\/',
        '^PHP\\/',
        '^pip\\/',
        '^pnpm\\/',
        '^RMA\\/',
        '^Ruby|Ruby\\/[0-9]',
        '^Swurl ',
        '^TLS tester ',
        '^twine\\/',
        '^ureq',
        '^VSE\\/[0-9]',
        '^WordPress\\.com',
        '^XRL\\/[0-9]',
        '^ZmEu',
        '008\\/',
        '13TABS',
        '192\\.comAgent',
        '2GDPR\\/',
        '2ip\\.ru',
        '404enemy',
        '7Siters',
        '80legs',
        'a3logics\\.in',
        'A6-Indexer',
        'Abonti',
        'Aboundex',
        'aboutthedomain',
        'Accoona-AI-Agent',
        'acebookexternalhit\\/',
        'acoon',
        'acrylicapps\\.com\\/pulp',
        'Acunetix',
        'AdAuth\\/',
        'adbeat',
        'AddThis',
        'ADmantX',
        'AdminLabs',
        'adressendeutschland',
        'adreview\\/',
        'adscanner',
        'adstxt-worker',
        'Adstxtaggregator',
        'adstxt\\.com',
        'Adyen HttpClient',
        'AffiliateLabz\\/',
        'affilimate-puppeteer',
        'agentslug',
        'AHC',
        'aihit',
        'aiohttp\\/',
        'Airmail',
        'akka-http\\/',
        'akula\\/',
        'alertra',
        'alexa site audit',
        'Alibaba\\.Security\\.Heimdall',
        'Alligator',
        'allloadin',
        'AllSubmitter',
        'alyze\\.info',
        'amagit',
        'Anarchie',
        'AndroidDownloadManager',
        'Anemone',
        'AngleSharp',
        'annotate_google',
        'Anthill',
        'Anturis Agent',
        'Ant\\.com',
        'AnyEvent-HTTP\\/',
        'Apache Ant\\/',
        'Apache Droid',
        'Apache OpenOffice',
        'Apache-HttpAsyncClient',
        'Apache-HttpClient',
        'ApacheBench',
        'Apexoo',
        'apimon\\.de',
        'APIs-Google',
        'AportWorm\\/',
        'AppBeat\\/',
        'AppEngine-Google',
        'AppleSyndication',
        'Aprc\\/[0-9]',
        'Arachmo',
        'arachnode',
        'Arachnophilia',
        'aria2',
        'Arukereso',
        'asafaweb',
        'Asana\\/',
        'Ask Jeeves',
        'AskQuickly',
        'ASPSeek',
        'Asterias',
        'Astute',
        'asynchttp',
        'Attach',
        'attohttpc',
        'autocite',
        'AutomaticWPTester',
        'Autonomy',
        'awin\\.com',
        'AWS Security Scanner',
        'axios\\/',
        'a\\.pr-cy\\.ru',
        'B-l-i-t-z-B-O-T',
        'Backlink-Ceck',
        'backlink-check',
        'BacklinkHttpStatus',
        'BackStreet',
        'BackupLand',
        'BackWeb',
        'Bad-Neighborhood',
        'Badass',
        'baidu\\.com',
        'Bandit',
        'basicstate',
        'BatchFTP',
        'Battleztar Bazinga',
        'baypup\\/',
        'BazQux',
        'BBBike',
        'BCKLINKS',
        'BDFetch',
        'BegunAdvertising',
        'Bewica-security-scan',
        'Bidtellect',
        'BigBozz',
        'Bigfoot',
        'biglotron',
        'BingLocalSearch',
        'BingPreview',
        'binlar',
        'biNu image cacher',
        'Bitacle',
        'Bitrix link preview',
        'biz_Directory',
        'BKCTwitterUnshortener\\/',
        'Black Hole',
        'Blackboard Safeassign',
        'BlackWidow',
        'BlockNote\\.Net',
        'BlogBridge',
        'Bloglines',
        'Bloglovin',
        'BlogPulseLive',
        'BlogSearch',
        'Blogtrottr',
        'BlowFish',
        'boitho\\.com-dc',
        'Boost\\.Beast',
        'BPImageWalker',
        'Braintree-Webhooks',
        'Branch Metrics API',
        'Branch-Passthrough',
        'Brandprotect',
        'BrandVerity',
        'Brandwatch',
        'Brodie\\/',
        'Browsershots',
        'BUbiNG',
        'Buck\\/',
        'Buddy',
        'BuiltWith',
        'Bullseye',
        'BunnySlippers',
        'Burf Search',
        'Butterfly\\/',
        'BuzzSumo',
        'CAAM\\/[0-9]',
        'CakePHP',
        'Calculon',
        'Canary%20Mail',
        'CaretNail',
        'catexplorador',
        'CC Metadata Scaper',
        'Cegbfeieh',
        'censys',
        'centuryb.o.t9[at]gmail.com',
        'Cerberian Drtrs',
        'CERT\\.at-Statistics-Survey',
        'cf-facebook',
        'cg-eye',
        'changedetection',
        'ChangesMeter',
        'Charlotte',
        'CheckHost',
        'checkprivacy',
        'CherryPicker',
        'ChinaClaw',
        'Chirp\\/',
        'chkme\\.com',
        'Chlooe',
        'Chromaxa',
        'CirrusExplorer',
        'CISPA Vulnerability Notification',
        'CISPA Web Analyser',
        'Citoid',
        'CJNetworkQuality',
        'Clarsentia',
        'clips\\.ua\\.ac\\.be',
        'Cloud mapping',
        'CloudEndure',
        'CloudFlare-AlwaysOnline',
        'Cloudflare-Healthchecks',
        'Cloudinary',
        'cmcm\\.com',
        'coccoc',
        'cognitiveseo',
        'ColdFusion',
        'colly -',
        'CommaFeed',
        'Commons-HttpClient',
        'commonscan',
        'contactbigdatafr',
        'contentkingapp',
        'Contextual Code Sites Explorer',
        'convera',
        'CookieReports',
        'copyright sheriff',
        'CopyRightCheck',
        'Copyscape',
        'cortex\\/',
        'Cosmos4j\\.feedback',
        'Covario-IDS',
        'Craw\\/',
        'Crescent',
        'Criteo',
        'Crowsnest',
        'CSHttp',
        'CSSCheck',
        'Cula\\/',
        'curb',
        'Curious George',
        'curl',
        'cuwhois\\/',
        'cybo\\.com',
        'DAP\\/NetHTTP',
        'DareBoost',
        'DatabaseDriverMysqli',
        'DataCha0s',
        'Datafeedwatch',
        'Datanyze',
        'DataparkSearch',
        'dataprovider',
        'DataXu',
        'Daum(oa)?[ \\/][0-9]',
        'dBpoweramp',
        'ddline',
        'deeris',
        'delve\\.ai',
        'Demon',
        'DeuSu',
        'developers\\.google\\.com\\/\\+\\/web\\/snippet\\/',
        'Devil',
        'Digg',
        'Digincore',
        'DigitalPebble',
        'Dirbuster',
        'Discourse Forum Onebox',
        'Dispatch\\/',
        'Disqus\\/',
        'DittoSpyder',
        'dlvr',
        'DMBrowser',
        'DNSPod-reporting',
        'docoloc',
        'Dolphin http client',
        'DomainAppender',
        'DomainLabz',
        'Domains Project\\/',
        'Donuts Content Explorer',
        'dotMailer content retrieval',
        'dotSemantic',
        'downforeveryoneorjustme',
        'Download Wonder',
        'downnotifier',
        'DowntimeDetector',
        'Drip',
        'drupact',
        'Drupal \\(\\+http:\\/\\/drupal\\.org\\/\\)',
        'DTS Agent',
        'dubaiindex',
        'DuplexWeb-Google',
        'DynatraceSynthetic',
        'EARTHCOM',
        'Easy-Thumb',
        'EasyDL',
        'Ebingbong',
        'ec2linkfinder',
        'eCairn-Grabber',
        'eCatch',
        'ECCP',
        'eContext\\/',
        'Ecxi',
        'EirGrabber',
        'ElectricMonk',
        'elefent',
        'EMail Exractor',
        'EMail Wolf',
        'EmailWolf',
        'Embarcadero',
        'Embed PHP Library',
        'Embedly',
        'endo\\/',
        'europarchive\\.org',
        'evc-batch',
        'EventMachine HttpClient',
        'Everwall Link Expander',
        'Evidon',
        'Evrinid',
        'ExactSearch',
        'ExaleadCloudview',
        'Excel\\/',
        'exif',
        'ExoRank',
        'Exploratodo',
        'Express WebPictures',
        'Extreme Picture Finder',
        'EyeNetIE',
        'ezooms',
        'facebookexternalhit',
        'facebookexternalua',
        'facebookplatform',
        'fairshare',
        'Faraday v',
        'fasthttp',
        'Faveeo',
        'Favicon downloader',
        'faviconarchive',
        'faviconkit',
        'FavOrg',
        'Feed Wrangler',
        'Feedable\\/',
        'Feedbin',
        'FeedBooster',
        'FeedBucket',
        'FeedBunch\\/',
        'FeedBurner',
        'feeder',
        'Feedly',
        'FeedshowOnline',
        'Feedshow\\/',
        'Feedspot',
        'FeedViewer\\/',
        'Feedwind\\/',
        'FeedZcollector',
        'feeltiptop',
        'Fetch API',
        'Fetch\\/[0-9]',
        'Fever\\/[0-9]',
        'FHscan',
        'Fiery%20Feeds',
        'Filestack',
        'Fimap',
        'findlink',
        'findthatfile',
        'FlashGet',
        'FlipboardBrowserProxy',
        'FlipboardProxy',
        'FlipboardRSS',
        'Flock\\/',
        'Florienzh\\/',
        'fluffy',
        'Flunky',
        'flynxapp',
        'forensiq',
        'FoundSeoTool',
        'free thumbnails',
        'Freeuploader',
        'FreshRSS',
        'Funnelback',
        'Fuzz Faster U Fool',
        'G-i-g-a-b-o-t',
        'g00g1e\\.net',
        'ganarvisitas',
        'gdnplus\\.com',
        'geek-tools',
        'Genieo',
        'GentleSource',
        'GetCode',
        'Getintent',
        'GetLinkInfo',
        'getprismatic',
        'GetRight',
        'getroot',
        'GetURLInfo\\/',
        'GetWeb',
        'Geziyor',
        'Ghost Inspector',
        'GigablastOpenSource',
        'GIS-LABS',
        'github-camo',
        'GitHub-Hookshot',
        'github\\.com',
        'Go http package',
        'Go [\\d\\.]* package http',
        'Go!Zilla',
        'Go-Ahead-Got-It',
        'Go-http-client',
        'go-mtasts\\/',
        'gobyus',
        'Gofeed',
        'gofetch',
        'Goldfire Server',
        'GomezAgent',
        'gooblog',
        'Goodzer\\/',
        'Google AppsViewer',
        'Google Desktop',
        'Google favicon',
        'Google Keyword Suggestion',
        'Google Keyword Tool',
        'Google Page Speed Insights',
        'Google PP Default',
        'Google Search Console',
        'Google Web Preview',
        'Google-Ads-Creatives-Assistant',
        'Google-Ads-Overview',
        'Google-Adwords',
        'Google-Apps-Script',
        'Google-Calendar-Importer',
        'Google-HotelAdsVerifier',
        'Google-HTTP-Java-Client',
        'Google-Podcast',
        'Google-Publisher-Plugin',
        'Google-Read-Aloud',
        'Google-SearchByImage',
        'Google-Site-Verification',
        'Google-SMTP-STS',
        'Google-speakr',
        'Google-Structured-Data-Testing-Tool',
        'Google-Transparency-Report',
        'google-xrawler',
        'Google-Youtube-Links',
        'GoogleDocs',
        'GoogleHC\\/',
        'GoogleProber',
        'GoogleProducer',
        'GoogleSites',
        'Gookey',
        'GoSpotCheck',
        'gosquared-thumbnailer',
        'Gotit',
        'GoZilla',
        'grabify',
        'GrabNet',
        'Grafula',
        'Grammarly',
        'GrapeFX',
        'GreatNews',
        'Gregarius',
        'GRequests',
        'grokkit',
        'grouphigh',
        'grub-client',
        'gSOAP\\/',
        'GT::WWW',
        'GTmetrix',
        'GuzzleHttp',
        'gvfs\\/',
        'HAA(A)?RTLAND http client',
        'Haansoft',
        'hackney\\/',
        'Hadi Agent',
        'HappyApps-WebCheck',
        'Hardenize',
        'Hatena',
        'Havij',
        'HaxerMen',
        'HeadlessChrome',
        'HEADMasterSEO',
        'HeartRails_Capture',
        'help@dataminr\\.com',
        'heritrix',
        'Hexometer',
        'historious',
        'hkedcity',
        'hledejLevne\\.cz',
        'Hloader',
        'HMView',
        'Holmes',
        'HonesoSearchEngine',
        'HootSuite Image proxy',
        'Hootsuite-WebFeed',
        'hosterstats',
        'HostTracker',
        'ht:\\/\\/check',
        'htdig',
        'HTMLparser',
        'htmlyse',
        'HTTP Banner Detection',
        'http-get',
        'HTTP-Header-Abfrage',
        'http-kit',
        'http-request\\/',
        'HTTP-Tiny',
        'HTTP::Lite',
        'http:\\/\\/www.neomo.de\\/',
        'HttpComponents',
        'httphr',
        'HTTPie',
        'HTTPMon',
        'httpRequest',
        'httpscheck',
        'httpssites_power',
        'httpunit',
        'HttpUrlConnection',
        'http\\.rb\\/',
        'HTTP_Compression_Test',
        'http_get',
        'http_request2',
        'http_requester',
        'httrack',
        'huaweisymantec',
        'HubSpot ',
        'HubSpot-Link-Resolver',
        'Humanlinks',
        'i2kconnect\\/',
        'Iblog',
        'ichiro',
        'Id-search',
        'IdeelaborPlagiaat',
        'IDG Twitter Links Resolver',
        'IDwhois\\/',
        'Iframely',
        'igdeSpyder',
        'iGooglePortal',
        'IlTrovatore',
        'Image Fetch',
        'Image Sucker',
        'ImageEngine\\/',
        'ImageVisu\\/',
        'Imagga',
        'imagineeasy',
        'imgsizer',
        'InAGist',
        'inbound\\.li parser',
        'InDesign%20CC',
        'Indy Library',
        'InetURL',
        'infegy',
        'infohelfer',
        'InfoTekies',
        'InfoWizards Reciprocal Link',
        'inpwrd\\.com',
        'instabid',
        'Instapaper',
        'Integrity',
        'integromedb',
        'Intelliseek',
        'InterGET',
        'Internet Ninja',
        'InternetSeer',
        'internetVista monitor',
        'internetwache',
        'internet_archive',
        'intraVnews',
        'IODC',
        'IOI',
        'iplabel',
        'ips-agent',
        'IPS\\/[0-9]',
        'IPWorks HTTP\\/S Component',
        'iqdb\\/',
        'Iria',
        'Irokez',
        'isitup\\.org',
        'iskanie',
        'isUp\\.li',
        'iThemes Sync\\/',
        'IZaBEE',
        'iZSearch',
        'JAHHO',
        'janforman',
        'Jaunt\\/',
        'Java.*outbrain',
        'javelin\\.io',
        'Jbrofuzz',
        'Jersey\\/',
        'JetCar',
        'Jigsaw',
        'Jobboerse',
        'JobFeed discovery',
        'Jobg8 URL Monitor',
        'jobo',
        'Jobrapido',
        'Jobsearch1\\.5',
        'JoinVision Generic',
        'JolokiaPwn',
        'Joomla',
        'Jorgee',
        'JS-Kit',
        'JungleKeyThumbnail',
        'JustView',
        'Kaspersky Lab CFR link resolver',
        'Kelny\\/',
        'Kerrigan\\/',
        'KeyCDN',
        'Keyword Density',
        'Keywords Research',
        'khttp\\/',
        'KickFire',
        'KimonoLabs\\/',
        'Kml-Google',
        'knows\\.is',
        'KOCMOHABT',
        'kouio',
        'kube-probe',
        'kubectl',
        'kulturarw3',
        'KumKie',
        'Larbin',
        'Lavf\\/',
        'leakix\\.net',
        'LeechFTP',
        'LeechGet',
        'letsencrypt',
        'Lftp',
        'LibVLC',
        'LibWeb',
        'Libwhisker',
        'libwww',
        'Licorne',
        'Liferea\\/',
        'Lighthouse',
        'Lightspeedsystems',
        'Likse',
        'limber\\.io',
        'Link Valet',
        'LinkAlarm\\/',
        'LinkAnalyser',
        'linkCheck',
        'linkdex',
        'LinkExaminer',
        'linkfluence',
        'linkpeek',
        'LinkPreview',
        'LinkScan',
        'LinksManager',
        'LinkTiger',
        'LinkWalker',
        'link_thumbnailer',
        'Lipperhey',
        'Litemage_walker',
        'livedoor ScreenShot',
        'LoadImpactRload',
        'localsearch-web',
        'LongURL API',
        'longurl-r-package',
        'looid\\.com',
        'looksystems\\.net',
        'ltx71',
        'lua-resty-http',
        'Lucee \\(CFML Engine\\)',
        'Lush Http Client',
        'lwp-request',
        'lwp-trivial',
        'LWP::Simple',
        'lycos',
        'LYT\\.SR',
        'L\\.webis',
        'mabontland',
        'MacOutlook\\/',
        'Mag-Net',
        'MagpieRSS',
        'Mail::STS',
        'MailChimp',
        'Mail\\.Ru',
        'Majestic12',
        'makecontact\\/',
        'Mandrill',
        'MapperCmd',
        'marketinggrader',
        'MarkMonitor',
        'MarkWatch',
        'Mass Downloader',
        'masscan\\/',
        'Mata Hari',
        'mattermost',
        'Mediametric',
        'Mediapartners-Google',
        'mediawords',
        'MegaIndex\\.ru',
        'MeltwaterNews',
        'Melvil Rawi',
        'MemGator',
        'Metaspinner',
        'MetaURI',
        'MFC_Tear_Sample',
        'Microsearch',
        'Microsoft Data Access',
        'Microsoft Office',
        'Microsoft Outlook',
        'Microsoft Windows Network Diagnostics',
        'Microsoft-WebDAV-MiniRedir',
        'Microsoft\\.Data\\.Mashup',
        'MIDown tool',
        'MIIxpc',
        'Mindjet',
        'Miniature\\.io',
        'Miniflux',
        'mio_httpc',
        'Miro-HttpClient',
        'Mister PiX',
        'mixdata dot com',
        'mixed-content-scan',
        'mixnode',
        'Mnogosearch',
        'mogimogi',
        'Mojeek',
        'Mojolicious \\(Perl\\)',
        'monitis',
        'Monitority\\/',
        'Monit\\/',
        'montastic',
        'MonTools',
        'Moreover',
        'Morfeus Fucking Scanner',
        'Morning Paper',
        'MovableType',
        'mowser',
        'Mrcgiguy',
        'Mr\\.4x3 Powered',
        'MS Web Services Client Protocol',
        'MSFrontPage',
        'mShots',
        'MuckRack\\/',
        'muhstik-scan',
        'MVAClient',
        'MxToolbox\\/',
        'myseosnapshot',
        'nagios',
        'Najdi\\.si',
        'Name Intelligence',
        'NameFo\\.com',
        'Nameprotect',
        'nationalarchives',
        'Navroad',
        'NearSite',
        'Needle',
        'Nessus',
        'Net Vampire',
        'NetAnts',
        'NETCRAFT',
        'NetLyzer',
        'NetMechanic',
        'NetNewsWire',
        'Netpursual',
        'netresearch',
        'NetShelter ContentScan',
        'Netsparker',
        'NetSystemsResearch',
        'nettle',
        'NetTrack',
        'Netvibes',
        'NetZIP',
        'Neustar WPM',
        'NeutrinoAPI',
        'NewRelicPinger',
        'NewsBlur .*Finder',
        'NewsGator',
        'newsme',
        'newspaper\\/',
        'Nexgate Ruby Client',
        'NG-Search',
        'nghttp2',
        'Nibbler',
        'NICErsPRO',
        'NihilScio',
        'Nikto',
        'nineconnections',
        'NLNZ_IAHarvester',
        'Nmap Scripting Engine',
        'node-fetch',
        'node-superagent',
        'node-urllib',
        'Nodemeter',
        'NodePing',
        'node\\.io',
        'nominet\\.org\\.uk',
        'nominet\\.uk',
        'Norton-Safeweb',
        'Notifixious',
        'notifyninja',
        'NotionEmbedder',
        'nuhk',
        'nutch',
        'Nuzzel',
        'nWormFeedFinder',
        'nyawc\\/',
        'Nymesis',
        'NYU',
        'Observatory\\/',
        'Ocelli\\/',
        'Octopus',
        'oegp',
        'Offline Explorer',
        'Offline Navigator',
        'OgScrper',
        'okhttp',
        'omgili',
        'OMSC',
        'Online Domain Tools',
        'Open Source RSS',
        'OpenCalaisSemanticProxy',
        'Openfind',
        'OpenLinkProfiler',
        'Openstat\\/',
        'OpenVAS',
        'OPPO A33',
        'Optimizer',
        'Orbiter',
        'OrgProbe\\/',
        'orion-semantics',
        'Outlook-Express',
        'Outlook-iOS',
        'Owler',
        'Owlin',
        'ownCloud News',
        'ow\\.ly',
        'OxfordCloudService',
        'page scorer',
        'Page Valet',
        'page2rss',
        'PageFreezer',
        'PageGrabber',
        'PagePeeker',
        'PageScorer',
        'Pagespeed\\/',
        'PageThing',
        'page_verifier',
        'Panopta',
        'panscient',
        'Papa Foto',
        'parsijoo',
        'Pavuk',
        'PayPal IPN',
        'pcBrowser',
        'Pcore-HTTP',
        'PDF24 URL To PDF',
        'Pearltrees',
        'PECL::HTTP',
        'peerindex',
        'Peew',
        'PeoplePal',
        'Perlu -',
        'PhantomJS Screenshoter',
        'PhantomJS\\/',
        'Photon\\/',
        'php-requests',
        'phpservermon',
        'Pi-Monster',
        'Picscout',
        'Picsearch',
        'PictureFinder',
        'Pimonster',
        'Pingability',
        'PingAdmin\\.Ru',
        'Pingdom',
        'Pingoscope',
        'PingSpot',
        'ping\\.blo\\.gs',
        'pinterest\\.com',
        'Pixray',
        'Pizilla',
        'Plagger\\/',
        'Pleroma ',
        'Ploetz \\+ Zeller',
        'Plukkie',
        'plumanalytics',
        'PocketImageCache',
        'PocketParser',
        'Pockey',
        'PodcastAddict\\/',
        'POE-Component-Client-HTTP',
        'Polymail\\/',
        'Pompos',
        'Porkbun',
        'Port Monitor',
        'postano',
        'postfix-mta-sts-resolver',
        'PostmanRuntime',
        'postplanner\\.com',
        'PostPost',
        'postrank',
        'PowerPoint\\/',
        'Prebid',
        'Prerender',
        'Priceonomics Analysis Engine',
        'PrintFriendly',
        'PritTorrent',
        'Prlog',
        'probethenet',
        'Project ?25499',
        'Project-Resonance',
        'prospectb2b',
        'Protopage',
        'ProWebWalker',
        'proximic',
        'PRTG Network Monitor',
        'pshtt, https scanning',
        'PTST ',
        'PTST\\/[0-9]+',
        'Pump',
        'Python-httplib2',
        'python-httpx',
        'python-requests',
        'Python-urllib',
        'Qirina Hurdler',
        'QQDownload',
        'QrafterPro',
        'Qseero',
        'Qualidator',
        'QueryN Metasearch',
        'queuedriver',
        'quic-go-HTTP\\/',
        'QuiteRSS',
        'Quora Link Preview',
        'Qwantify',
        'Radian6',
        'RadioPublicImageResizer',
        'Railgun\\/',
        'RankActive',
        'RankFlex',
        'RankSonicSiteAuditor',
        'RapidLoad\\/',
        'Re-re Studio',
        'ReactorNetty',
        'Readability',
        'RealDownload',
        'RealPlayer%20Downloader',
        'RebelMouse',
        'Recorder',
        'RecurPost\\/',
        'redback\\/',
        'ReederForMac',
        'Reeder\\/',
        'ReGet',
        'RepoMonkey',
        'request\\.js',
        'reqwest\\/',
        'ResponseCodeTest',
        'RestSharp',
        'Riddler',
        'Rival IQ',
        'Robosourcer',
        'Robozilla',
        'ROI Hunter',
        'RPT-HTTPClient',
        'RSSMix\\/',
        'RSSOwl',
        'RyowlEngine',
        'safe-agent-scanner',
        'SalesIntelligent',
        'Saleslift',
        'SAP NetWeaver Application Server',
        'SauceNAO',
        'SBIder',
        'sc-downloader',
        'scalaj-http',
        'Scamadviser-Frontend',
        'ScanAlert',
        'scan\\.lol',
        'Scoop',
        'scooter',
        'ScopeContentAG-HTTP-Client',
        'ScoutJet',
        'ScoutURLMonitor',
        'ScrapeBox Page Scanner',
        'Scrapy',
        'Screaming',
        'ScreenShotService',
        'Scrubby',
        'Scrutiny\\/',
        'Search37',
        'searchenginepromotionhelp',
        'Searchestate',
        'SearchExpress',
        'SearchSight',
        'SearchWP',
        'search\\.thunderstone',
        'Seeker',
        'semanticdiscovery',
        'semanticjuice',
        'Semiocast HTTP client',
        'Semrush',
        'Sendsay\\.Ru',
        'sentry\\/',
        'SEO Browser',
        'Seo Servis',
        'seo-nastroj\\.cz',
        'seo4ajax',
        'Seobility',
        'SEOCentro',
        'SeoCheck',
        'SEOkicks',
        'SEOlizer',
        'Seomoz',
        'SEOprofiler',
        'seoscanners',
        'SEOsearch',
        'seositecheckup',
        'SEOstats',
        'servernfo',
        'sexsearcher',
        'Seznam',
        'Shelob',
        'Shodan',
        'Shoppimon',
        'ShopWiki',
        'ShortLinkTranslate',
        'shortURL lengthener',
        'shrinktheweb',
        'Sideqik',
        'Siege',
        'SimplePie',
        'SimplyFast',
        'Siphon',
        'SISTRIX',
        'Site Sucker',
        'Site-Shot\\/',
        'Site24x7',
        'SiteBar',
        'Sitebeam',
        'Sitebulb\\/',
        'SiteCondor',
        'SiteExplorer',
        'SiteGuardian',
        'Siteimprove',
        'SiteIndexed',
        'Sitemap(s)? Generator',
        'SitemapGenerator',
        'SiteMonitor',
        'Siteshooter B0t',
        'SiteSnagger',
        'SiteSucker',
        'SiteTruth',
        'Sitevigil',
        'sitexy\\.com',
        'SkypeUriPreview',
        'Slack\\/',
        'sli-systems\\.com',
        'slider\\.com',
        'slurp',
        'SlySearch',
        'SmartDownload',
        'SMRF URL Expander',
        'SMUrlExpander',
        'Snake',
        'Snappy',
        'SnapSearch',
        'Snarfer\\/',
        'SniffRSS',
        'sniptracker',
        'Snoopy',
        'SnowHaze Search',
        'sogou web',
        'SortSite',
        'Sottopop',
        'sovereign\\.ai',
        'SpaceBison',
        'SpamExperts',
        'Spammen',
        'Spanner',
        'spaziodati',
        'SPDYCheck',
        'Specificfeeds',
        'speedy',
        'SPEng',
        'Spinn3r',
        'spray-can',
        'Sprinklr ',
        'spyonweb',
        'sqlmap',
        'Sqlworm',
        'Sqworm',
        'SSL Labs',
        'ssl-tools',
        'StackRambler',
        'Statastico\\/',
        'Statically-',
        'StatusCake',
        'Steeler',
        'Stratagems Kumo',
        'Stripe\\/',
        'Stroke\\.cz',
        'StudioFACA',
        'StumbleUpon',
        'suchen',
        'Sucuri',
        'summify',
        'SuperHTTP',
        'Surphace Scout',
        'Suzuran',
        'swcd ',
        'Symfony BrowserKit',
        'Symfony2 BrowserKit',
        'Synapse\\/',
        'Syndirella\\/',
        'SynHttpClient-Built',
        'Sysomos',
        'sysscan',
        'Szukacz',
        'T0PHackTeam',
        'tAkeOut',
        'Tarantula\\/',
        'Taringa UGC',
        'TarmotGezgin',
        'tchelebi\\.io',
        'techiaith\\.cymru',
        'TelegramBot',
        'Teleport',
        'Telesoft',
        'Telesphoreo',
        'Telesphorep',
        'Tenon\\.io',
        'teoma',
        'terrainformatica',
        'Test Certificate Info',
        'testuri',
        'Tetrahedron',
        'TextRazor Downloader',
        'The Drop Reaper',
        'The Expert HTML Source Viewer',
        'The Intraformant',
        'The Knowledge AI',
        'theinternetrules',
        'TheNomad',
        'Thinklab',
        'Thumbor',
        'Thumbshots',
        'ThumbSniper',
        'timewe\\.net',
        'TinEye',
        'Tiny Tiny RSS',
        'TLSProbe\\/',
        'Toata',
        'topster',
        'touche\\.com',
        'Traackr\\.com',
        'tracemyfile',
        'Trackuity',
        'TrapitAgent',
        'Trendiction',
        'Trendsmap',
        'trendspottr',
        'truwoGPS',
        'TryJsoup',
        'TulipChain',
        'Turingos',
        'Turnitin',
        'tweetedtimes',
        'Tweetminster',
        'Tweezler\\/',
        'twibble',
        'Twice',
        'Twikle',
        'Twingly',
        'Twisted PageGetter',
        'Typhoeus',
        'ubermetrics-technologies',
        'uclassify',
        'UdmSearch',
        'ultimate_sitemap_parser',
        'unchaos',
        'unirest-java',
        'UniversalFeedParser',
        'unshortenit',
        'Unshorten\\.It',
        'Untiny',
        'UnwindFetchor',
        'updated',
        'updown\\.io daemon',
        'Upflow',
        'Uptimia',
        'URL Verifier',
        'Urlcheckr',
        'URLitor',
        'urlresolver',
        'Urlstat',
        'URLTester',
        'UrlTrends Ranking Updater',
        'URLy Warning',
        'URLy\\.Warning',
        'URL\\/Emacs',
        'Vacuum',
        'Vagabondo',
        'VB Project',
        'vBSEO',
        'VCI',
        'via ggpht\\.com GoogleImageProxy',
        'Virusdie',
        'visionutils',
        'vkShare',
        'VoidEYE',
        'Voil',
        'voltron',
        'voyager\\/',
        'VSAgent\\/',
        'VSB-TUO\\/',
        'Vulnbusters Meter',
        'VYU2',
        'w3af\\.org',
        'W3C-checklink',
        'W3C-mobileOK',
        'W3C_Unicorn',
        'WAC-OFU',
        'WakeletLinkExpander',
        'WallpapersHD',
        'Wallpapers\\/[0-9]+',
        'wangling',
        'Wappalyzer',
        'WatchMouse',
        'WbSrch\\/',
        'WDT\\.io',
        'Web Auto',
        'Web Collage',
        'Web Enhancer',
        'Web Fetch',
        'Web Fuck',
        'Web Pix',
        'Web Sauger',
        'Web spyder',
        'Web Sucker',
        'web-capture\\.net',
        'Web-sniffer',
        'Webalta',
        'Webauskunft',
        'WebAuto',
        'WebCapture',
        'WebClient\\/',
        'webcollage',
        'WebCookies',
        'WebCopier',
        'WebCorp',
        'WebDataStats',
        'WebDoc',
        'WebEnhancer',
        'WebFetch',
        'WebFuck',
        'WebGazer',
        'WebGo IS',
        'WebImageCollector',
        'WebImages',
        'WebIndex',
        'webkit2png',
        'WebLeacher',
        'webmastercoffee',
        'webmon ',
        'WebPix',
        'WebReaper',
        'WebSauger',
        'webscreenie',
        'Webshag',
        'Webshot',
        'Website Quester',
        'websitepulse agent',
        'WebsiteQuester',
        'Websnapr',
        'WebSniffer',
        'Webster',
        'WebStripper',
        'WebSucker',
        'webtech\\/',
        'WebThumbnail',
        'Webthumb\\/',
        'WebWhacker',
        'WebZIP',
        'WeLikeLinks',
        'WEPA',
        'WeSEE',
        'wf84',
        'Wfuzz\\/',
        'wget',
        'WhatCMS',
        'WhatsApp',
        'WhatsMyIP',
        'WhatWeb',
        'WhereGoes\\?',
        'Whibse',
        'WhoAPI\\/',
        'WhoRunsCoinHive',
        'Whynder Magnet',
        'Windows-RSS-Platform',
        'WinHttp-Autoproxy-Service',
        'WinHTTP\\/',
        'WinPodder',
        'wkhtmlto',
        'wmtips',
        'Woko',
        'Wolfram HTTPClient',
        'woorankreview',
        'WordPress\\/',
        'WordupinfoSearch',
        'Word\\/',
        'worldping-api',
        'wotbox',
        'WP Engine Install Performance API',
        'WP Rocket',
        'wpif',
        'wprecon\\.com survey',
        'WPScan',
        'wscheck',
        'Wtrace',
        'WWW-Collector-E',
        'WWW-Mechanize',
        'WWW::Document',
        'WWW::Mechanize',
        'WWWOFFLE',
        'www\\.monitor\\.us',
        'x09Mozilla',
        'x22Mozilla',
        'XaxisSemanticsClassifier',
        'XenForo\\/',
        'Xenu Link Sleuth',
        'XING-contenttabreceiver',
        'xpymep([0-9]?)\\.exe',
        'Y!J-[A-Z][A-Z][A-Z]',
        'Yaanb',
        'yacy',
        'Yahoo Link Preview',
        'YahooCacheSystem',
        'YahooMailProxy',
        'YahooYSMcm',
        'YandeG',
        'Yandex(?!Search)',
        'yanga',
        'yeti',
        'Yo-yo',
        'Yoleo Consumer',
        'yomins\\.com',
        'yoogliFetchAgent',
        'YottaaMonitor',
        'Your-Website-Sucks',
        'yourls\\.org',
        'YoYs\\.net',
        'YP\\.PL',
        'Zabbix',
        'Zade',
        'Zao',
        'Zauba',
        'Zemanta Aggregator',
        'Zend\\\\Http\\\\Client',
        'Zend_Http_Client',
        'Zermelo',
        'Zeus ',
        'zgrab',
        'ZnajdzFoto',
        'ZnHTTP',
        'Zombie\\.js',
        'Zoom\\.Mac',
        'ZoteroTranslationServer',
        'ZyBorg',
        '[a-z0-9\\-_]*(bot|crawl|archiver|transcoder|spider|uptime|validator|fetcher|cron|checker|reader|extractor|monitoring|analyzer|scraper)',
      ];
    }
  }

  var crawlers = Crawlers$1;

  const Provider$1 = provider;

  class Exclusions$1 extends Provider$1 {
    constructor() {
      super();

      this.data = [
        'Safari.[\\d\\.]*',
        'Firefox.[\\d\\.]*',
        ' Chrome.[\\d\\.]*',
        'Chromium.[\\d\\.]*',
        'MSIE.[\\d\\.]',
        'Opera\\/[\\d\\.]*',
        'Mozilla.[\\d\\.]*',
        'AppleWebKit.[\\d\\.]*',
        'Trident.[\\d\\.]*',
        'Windows NT.[\\d\\.]*',
        'Android [\\d\\.]*',
        'Macintosh.',
        'Ubuntu',
        'Linux',
        '[ ]Intel',
        'Mac OS X [\\d_]*',
        '(like )?Gecko(.[\\d\\.]*)?',
        'KHTML,',
        'CriOS.[\\d\\.]*',
        'CPU iPhone OS ([0-9_])* like Mac OS X',
        'CPU OS ([0-9_])* like Mac OS X',
        'iPod',
        'compatible',
        'x86_..',
        'i686',
        'x64',
        'X11',
        'rv:[\\d\\.]*',
        'Version.[\\d\\.]*',
        'WOW64',
        'Win64',
        'Dalvik.[\\d\\.]*',
        ' \\.NET CLR [\\d\\.]*',
        'Presto.[\\d\\.]*',
        'Media Center PC',
        'BlackBerry',
        'Build',
        'Opera Mini\\/\\d{1,2}\\.\\d{1,2}\\.[\\d\\.]*\\/\\d{1,2}\\.',
        'Opera',
        ' \\.NET[\\d\\.]*',
        'cubot',
        '; M bot',
        '; CRONO',
        '; B bot',
        '; IDbot',
        '; ID bot',
        '; POWER BOT',
        'OCTOPUS-CORE',
      ];
    }
  }

  var exclusions = Exclusions$1;

  const Provider = provider;

  class Headers$1 extends Provider {
    constructor() {
      super();

      this.data = [
        'USER-AGENT',
        'X-OPERAMINI-PHONE-UA',
        'X-DEVICE-USER-AGENT',
        'X-ORIGINAL-USER-AGENT',
        'X-SKYFIRE-PHONE',
        'X-BOLT-PHONE-UA',
        'DEVICE-STOCK-UA',
        'X-UCBROWSER-DEVICE-UA',
        'FROM',
        'X-SCANNER',
      ];
    }
  }

  var headers = Headers$1;

  const Crawlers = crawlers;
  const Exclusions = exclusions;
  const Headers = headers;

  class Crawler$1 {
    constructor(request, headers, userAgent) {
      /**
       * Init classes
       */
      this._init();

      /**
       * This request must be an object
       */
      this.request = typeof request === 'object' ? request : {};

      // The regex-list must not be used with g-flag!
      // See: https://stackoverflow.com/questions/1520800/why-does-a-regexp-with-global-flag-give-wrong-results
      this.compiledRegexList = this.compileRegex(this.crawlers.getAll(), 'i');

      // The exclusions should be used with g-flag in order to remove each value.
      this.compiledExclusions = this.compileRegex(this.exclusions.getAll(), 'gi');

      /**
       * Set http headers
       */
      this.setHttpHeaders(headers);

      /**
       * Set userAgent
       */
      this.userAgent = this.setUserAgent(userAgent);
    }

    /**
     * Init Classes Instances
     */
    _init() {
      this.crawlers = new Crawlers();
      this.headers = new Headers();
      this.exclusions = new Exclusions();
    }

    compileRegex(patterns, flags) {
      return new RegExp(patterns.join('|'), flags);
    }

    /**
     * Set HTTP headers.
     */
    setHttpHeaders(headers) {
      // Use the Request headers if httpHeaders is not defined
      if (typeof headers === 'undefined' || Object.keys(headers).length === 0) {
        headers = Object.keys(this.request).length ? this.request.headers : {};
      }

      // Save the headers.
      this.httpHeaders = headers;
    }

    /**
     * Set user agent
     */
    setUserAgent(userAgent) {
      if (
        typeof userAgent === 'undefined' ||
        userAgent === null ||
        !userAgent.length
      ) {
        for (const header of this.getUaHttpHeaders()) {
          if (Object.keys(this.httpHeaders).indexOf(header.toLowerCase()) >= 0) {
            userAgent += this.httpHeaders[header.toLowerCase()] + ' ';
          }
        }
      }

      return userAgent;
    }

    /**
     * Get user agent headers
     */
    getUaHttpHeaders() {
      return this.headers.getAll();
    }

    /**
     * Check user agent string against the regex.
     */
    isCrawler(userAgent = undefined) {
      if (Buffer.byteLength(userAgent || '', 'utf8') > 4096) {
        return false;
      }

      var agent =
        typeof userAgent === 'undefined' || userAgent === null
          ? this.userAgent
          : userAgent;

      // test on compiled regx
      agent = agent.replace(this.compiledExclusions, '');

      if (agent.trim().length === 0) {
        return false;
      }

      var matches = this.compiledRegexList.exec(agent);

      if (matches) {
        this.matches = matches;
      }

      return matches !== null ? (matches.length ? true : false) : false;
    }

    /**
     * Return the matches.
     */
    getMatches() {
      return this.matches !== undefined
        ? this.matches.length
          ? this.matches[0]
          : null
        : {};
    }
  }

  var crawler = Crawler$1;

  const Crawler = crawler;

  var src = {
    Crawler,
    middleware(cb) {
      return (req, res, next) => {
        // If there is a cb, execute it
        if (typeof cb === 'function') {
          cb.call(req, res);
        }
        // Initiate
        req.Crawler = new Crawler(req);
        next();
      };
    },
  };

  function _createForOfIteratorHelper(o, allowArrayLike) { var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"]; if (!it) { if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e) { throw _e; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = it.call(o); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e2) { didErr = true; err = _e2; }, f: function f() { try { if (!normalCompletion && it.return != null) it.return(); } finally { if (didErr) throw err; } } }; }

  function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

  function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }
  var newTracker = function newTracker() {
    var wem = {
      /**
       * This function initialize the tracker
       *
       * @param {object} digitalData config of the tracker
       * @returns {undefined}
       */
      initTracker: function initTracker(digitalData) {
        wem.digitalData = digitalData;
        wem.trackerProfileIdCookieName = wem.digitalData.wemInitConfig.trackerProfileIdCookieName ? wem.digitalData.wemInitConfig.trackerProfileIdCookieName : 'wem-profile-id';
        wem.trackerSessionIdCookieName = wem.digitalData.wemInitConfig.trackerSessionIdCookieName ? wem.digitalData.wemInitConfig.trackerSessionIdCookieName : 'wem-session-id';
        wem.browserGeneratedSessionSuffix = wem.digitalData.wemInitConfig.browserGeneratedSessionSuffix ? wem.digitalData.wemInitConfig.browserGeneratedSessionSuffix : '';
        wem.disableTrackedConditionsListeners = wem.digitalData.wemInitConfig.disableTrackedConditionsListeners;
        wem.activateWem = wem.digitalData.wemInitConfig.activateWem;
        var _wem$digitalData$wemI = wem.digitalData.wemInitConfig,
            contextServerUrl = _wem$digitalData$wemI.contextServerUrl,
            timeoutInMilliseconds = _wem$digitalData$wemI.timeoutInMilliseconds,
            contextServerCookieName = _wem$digitalData$wemI.contextServerCookieName;
        wem.contextServerCookieName = contextServerCookieName;
        wem.contextServerUrl = contextServerUrl;
        wem.timeoutInMilliseconds = timeoutInMilliseconds;
        wem.formNamesToWatch = [];
        wem.eventsPrevented = [];
        wem.sessionID = wem.getCookie(wem.trackerSessionIdCookieName);
        wem.fallback = false;

        if (wem.sessionID === null) {
          console.warn('[WEM] sessionID is null !');
        } else if (!wem.sessionID || wem.sessionID === '') {
          console.warn('[WEM] empty sessionID, setting to null !');
          wem.sessionID = null;
        }
      },

      /**
       * This function start the tracker by loading the context in the page
       * Note: that the tracker will start once the current DOM is complete loaded, using listener on current document: DOMContentLoaded
       *
       * @param {object[]} digitalDataOverrides optional, list of digitalData extensions, they will be merged with original digitalData before context loading
       * @returns {undefined}
       */
      startTracker: function startTracker() {
        var digitalDataOverrides = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : undefined;
        // Check before start
        var cookieDisabled = !navigator.cookieEnabled;
        var noSessionID = !wem.sessionID || wem.sessionID === '';
        var crawlerDetected = navigator.userAgent;

        if (crawlerDetected) {
          var browserDetector = new src.Crawler();
          crawlerDetected = browserDetector.isCrawler(navigator.userAgent);
        }

        if (cookieDisabled || noSessionID || crawlerDetected) {
          document.addEventListener('DOMContentLoaded', function () {
            wem._executeFallback('navigator cookie disabled: ' + cookieDisabled + ', no sessionID: ' + noSessionID + ', web crawler detected: ' + crawlerDetected);
          });
          return;
        } // Register base context callback


        wem._registerCallback(function () {
          if (wem.cxs.profileId) {
            wem.setCookie(wem.trackerProfileIdCookieName, wem.cxs.profileId);
          }

          if (!wem.cxs.profileId) {
            wem.removeCookie(wem.trackerProfileIdCookieName);
          }

          if (!wem.disableTrackedConditionsListeners) {
            wem._registerListenersForTrackedConditions();
          }
        }, 'Default tracker', 0); // Load the context once document is ready


        document.addEventListener('DOMContentLoaded', function () {
          wem.DOMLoaded = true; // enrich digital data considering extensions

          wem._handleDigitalDataOverrides(digitalDataOverrides); // complete already registered events


          wem._checkUncompleteRegisteredEvents(); // Dispatch javascript events for the experience (perso/opti displayed from SSR, based on unomi events)


          wem._dispatchJSExperienceDisplayedEvents(); // Some event may not need to be send to unomi, check for them and filter them out.


          wem._filterUnomiEvents(); // Add referrer info into digitalData.page object.


          wem._processReferrer(); // Build view event


          var viewEvent = wem.buildEvent('view', wem.buildTargetPage(), wem.buildSource(wem.digitalData.site.siteInfo.siteID, 'site'));
          viewEvent.flattenedProperties = {}; // Add URLParameters

          if (location.search) {
            viewEvent.flattenedProperties['URLParameters'] = wem.convertUrlParametersToObj(location.search);
          } // Add interests


          if (wem.digitalData.interests) {
            viewEvent.flattenedProperties['interests'] = wem.digitalData.interests;
          } // Register the page view event, it's unshift because it should be the first event, this is just for logical purpose. (page view comes before perso displayed event for example)


          wem._registerEvent(viewEvent, true);

          if (wem.activateWem) {
            wem.loadContext();
          } else {
            wem._executeFallback('wem is not activated on current page');
          }
        });
      },

      /**
       * get the current loaded context from Unomi, will be accessible only after loadContext() have been performed
       * @returns {object} loaded context
       */
      getLoadedContext: function getLoadedContext() {
        return wem.cxs;
      },

      /**
       * In case Unomi contains rules related to HTML forms in the current page.
       * The logic is simple, in case a rule exists in Unomi targeting a form event within the current webpage path
       *  - then this form will be identified as form to be watched.
       * You can reuse this function to get the list of concerned forms in order to attach listeners automatically for those form for example
       * (not that current tracker is doing that by default, check function: _registerListenersForTrackedConditions())
       * @returns {string[]} form names/ids in current web page
       */
      getFormNamesToWatch: function getFormNamesToWatch() {
        return wem.formNamesToWatch;
      },

      /**
       * Get current session id
       * @returns {null|string} get current session id
       */
      getSessionId: function getSessionId() {
        return wem.sessionID;
      },

      /**
       * This function will register a personalization
       *
       * @param {object} personalization the personalization object
       * @param {object} variants the variants
       * @param {boolean} [ajax] Deprecated: Ajax rendering is not supported anymore
       * @param {function} [resultCallback] the callback to be executed after personalization resolved
       * @returns {undefined}
       */
      registerPersonalizationObject: function registerPersonalizationObject(personalization, variants, ajax, resultCallback) {
        var target = personalization.id;

        wem._registerPersonalizationCallback(personalization, function (result, additionalResultInfos) {
          var selectedFilter = null;
          var successfulFilters = [];
          var inControlGroup = additionalResultInfos && additionalResultInfos.inControlGroup; // In case of control group Unomi is not resolving any strategy or fallback for us. So we have to do the fallback here.

          if (inControlGroup && personalization.strategyOptions && personalization.strategyOptions.fallback) {
            selectedFilter = variants[personalization.strategyOptions.fallback];
            successfulFilters.push(selectedFilter);
          } else {
            for (var i = 0; i < result.length; i++) {
              successfulFilters.push(variants[result[i]]);
            }

            if (successfulFilters.length > 0) {
              selectedFilter = successfulFilters[0];
              var minPos = successfulFilters[0].position;

              if (minPos >= 0) {
                for (var j = 1; j < successfulFilters.length; j++) {
                  if (successfulFilters[j].position < minPos) {
                    selectedFilter = successfulFilters[j];
                  }
                }
              }
            }
          }

          if (resultCallback) {
            // execute callback
            resultCallback(successfulFilters, selectedFilter);
          } else {
            if (selectedFilter) {
              var targetFilters = document.getElementById(target).children;

              for (var fIndex in targetFilters) {
                var filter = targetFilters.item(fIndex);

                if (filter) {
                  filter.style.display = filter.id === selectedFilter.content ? '' : 'none';
                }
              } // we now add control group information to event if the user is in the control group.


              if (inControlGroup) {
                console.info('[WEM] Profile is in control group for target: ' + target + ', adding to personalization event...');
                selectedFilter.event.target.properties.inControlGroup = true;

                if (selectedFilter.event.target.properties.variants) {
                  selectedFilter.event.target.properties.variants.forEach(function (variant) {
                    return variant.inControlGroup = true;
                  });
                }
              } // send event to unomi


              wem.collectEvent(wem._completeEvent(selectedFilter.event), function () {
                console.info('[WEM] Personalization event successfully collected.');
              }, function () {
                console.error('[WEM] Could not send personalization event.');
              }); //Trigger variant display event for personalization

              wem._dispatchJSExperienceDisplayedEvent(selectedFilter.event);
            } else {
              var elements = document.getElementById(target).children;

              for (var eIndex in elements) {
                var el = elements.item(eIndex);
                el.style.display = 'none';
              }
            }
          }
        });
      },

      /**
       * This function will register an optimization test or A/B test
       *
       * @param {string} optimizationTestNodeId the optimization test node id
       * @param {string} goalId the associated goal Id
       * @param {string} containerId the HTML container Id
       * @param {object} variants the variants
       * @param {boolean} [ajax] Deprecated: Ajax rendering is not supported anymore
       * @param {object} [variantsTraffic] the associated traffic allocation
       * @return {undefined}
       */
      registerOptimizationTest: function registerOptimizationTest(optimizationTestNodeId, goalId, containerId, variants, ajax, variantsTraffic) {
        // check persona panel forced variant
        var selectedVariantId = wem.getUrlParameter('wemSelectedVariantId-' + optimizationTestNodeId); // check already resolved variant stored in local

        if (selectedVariantId === null) {
          if (wem.storageAvailable('sessionStorage')) {
            selectedVariantId = sessionStorage.getItem(optimizationTestNodeId);
          } else {
            selectedVariantId = wem.getCookie('selectedVariantId');

            if (selectedVariantId != null && selectedVariantId === '') {
              selectedVariantId = null;
            }
          }
        } // select random variant and call unomi


        if (!(selectedVariantId && variants[selectedVariantId])) {
          var keys = Object.keys(variants);

          if (variantsTraffic) {
            var rand = 100 * Math.random() << 0;

            for (var nodeIdentifier in variantsTraffic) {
              if ((rand -= variantsTraffic[nodeIdentifier]) < 0 && selectedVariantId == null) {
                selectedVariantId = nodeIdentifier;
              }
            }
          } else {
            selectedVariantId = keys[keys.length * Math.random() << 0];
          }

          if (wem.storageAvailable('sessionStorage')) {
            sessionStorage.setItem(optimizationTestNodeId, selectedVariantId);
          } else {
            wem.setCookie('selectedVariantId', selectedVariantId, 1);
          } // spread event to unomi


          wem._registerEvent(wem._completeEvent(variants[selectedVariantId].event));
        } //Trigger variant display event for optimization
        // (Wrapped in DOMContentLoaded because opti are resulted synchronously at page load, so we dispatch the JS even after page load, to be sure that listeners are ready)


        window.addEventListener('DOMContentLoaded', function () {
          wem._dispatchJSExperienceDisplayedEvent(variants[selectedVariantId].event);
        });

        if (selectedVariantId) {
          // update persona panel selected variant
          if (window.optimizedContentAreas && window.optimizedContentAreas[optimizationTestNodeId]) {
            window.optimizedContentAreas[optimizationTestNodeId].selectedVariant = selectedVariantId;
          } // display the good variant


          document.getElementById(variants[selectedVariantId].content).style.display = '';
        }
      },

      /**
       * This function is used to load the current context in the page
       *
       * @param {boolean} [skipEvents=false] Should we send the events
       * @param {boolean} [invalidate=false] Should we invalidate the current context
       * @param {boolean} [forceReload=false] This function contains an internal check to avoid loading of the context multiple times.
       *                                      But in some rare cases, it could be useful to force the reloading of the context and bypass the check.
       * @return {undefined}
       */
      loadContext: function loadContext() {
        var skipEvents = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;
        var invalidate = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
        var forceReload = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;

        if (wem.contextLoaded && !forceReload) {
          console.log('Context already requested by', wem.contextLoaded);
          return;
        }

        var jsonData = {
          requiredProfileProperties: wem.digitalData.wemInitConfig.requiredProfileProperties,
          requiredSessionProperties: wem.digitalData.wemInitConfig.requiredSessionProperties,
          requireSegments: wem.digitalData.wemInitConfig.requireSegments,
          requireScores: wem.digitalData.wemInitConfig.requireScores,
          source: wem.buildSourcePage()
        };

        if (!skipEvents) {
          jsonData.events = wem.digitalData.events;
        }

        if (wem.digitalData.personalizationCallback) {
          jsonData.personalizations = wem.digitalData.personalizationCallback.map(function (x) {
            return x.personalization;
          });
        }

        jsonData.sessionId = wem.sessionID;
        var contextUrl = wem.contextServerUrl + '/context.json';

        if (invalidate) {
          contextUrl += '?invalidateSession=true&invalidateProfile=true';
        }

        wem.ajax({
          url: contextUrl,
          type: 'POST',
          async: true,
          contentType: 'text/plain;charset=UTF-8',
          // Use text/plain to avoid CORS preflight
          jsonData: jsonData,
          dataType: 'application/json',
          invalidate: invalidate,
          success: wem._onSuccess,
          error: function error() {
            wem._executeFallback('error during context loading');
          }
        });
        wem.contextLoaded = Error().stack;
        console.info('[WEM] context loading...');
      },

      /**
       * This function will send an event to Apache Unomi
       * @param {object} event The event object to send, you can build it using wem.buildEvent(eventType, target, source)
       * @param {function} successCallback optional, will be executed in case of success
       * @param {function} errorCallback optional, will be executed in case of error
       * @return {undefined}
       */
      collectEvent: function collectEvent(event) {
        var successCallback = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : undefined;
        var errorCallback = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : undefined;
        wem.collectEvents({
          events: [event]
        }, successCallback, errorCallback);
      },

      /**
       * This function will send the events to Apache Unomi
       *
       * @param {object} events Javascript object { events: [event1, event2] }
       * @param {function} successCallback optional, will be executed in case of success
       * @param {function} errorCallback optional, will be executed in case of error
       * @return {undefined}
       */
      collectEvents: function collectEvents(events) {
        var successCallback = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : undefined;
        var errorCallback = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : undefined;

        if (wem.fallback) {
          // in case of fallback we don't want to collect any events
          return;
        }

        events.sessionId = wem.sessionID ? wem.sessionID : '';
        var data = JSON.stringify(events);
        wem.ajax({
          url: wem.contextServerUrl + '/eventcollector',
          type: 'POST',
          async: true,
          contentType: 'text/plain;charset=UTF-8',
          // Use text/plain to avoid CORS preflight
          data: data,
          dataType: 'application/json',
          success: successCallback,
          error: errorCallback
        });
      },

      /**
       * This function will build an event of type click and send it to Apache Unomi
       *
       * @param {object} event javascript
       * @param {function} [successCallback] optional, will be executed if case of success
       * @param {function} [errorCallback] optional, will be executed if case of error
       * @return {undefined}
       */
      sendClickEvent: function sendClickEvent(event) {
        var successCallback = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : undefined;
        var errorCallback = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : undefined;

        if (event.target.id || event.target.name) {
          console.info('[WEM] Send click event');
          var targetId = event.target.id ? event.target.id : event.target.name;
          var clickEvent = wem.buildEvent('click', wem.buildTarget(targetId, event.target.localName), wem.buildSourcePage());
          var eventIndex = wem.eventsPrevented.indexOf(targetId);

          if (eventIndex !== -1) {
            wem.eventsPrevented.splice(eventIndex, 0);
          } else {
            wem.eventsPrevented.push(targetId);
            event.preventDefault();
            var target = event.target;
            wem.collectEvent(clickEvent, function (xhr) {
              console.info('[WEM] Click event successfully collected.');

              if (successCallback) {
                successCallback(xhr);
              } else {
                target.click();
              }
            }, function (xhr) {
              console.error('[WEM] Could not send click event.');

              if (errorCallback) {
                errorCallback(xhr);
              } else {
                target.click();
              }
            });
          }
        }
      },

      /**
       * This function will build an event of type video and send it to Apache Unomi
       *
       * @param {object} event javascript
       * @param {function} [successCallback] optional, will be executed if case of success
       * @param {function} [errorCallback] optional, will be executed if case of error
       * @return {undefined}
       */
      sendVideoEvent: function sendVideoEvent(event) {
        var successCallback = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : undefined;
        var errorCallback = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : undefined;
        console.info('[WEM] catching video event');
        var videoEvent = wem.buildEvent('video', wem.buildTarget(event.target.id, 'video', {
          action: event.type
        }), wem.buildSourcePage());
        wem.collectEvent(videoEvent, function (xhr) {
          console.info('[WEM] Video event successfully collected.');

          if (successCallback) {
            successCallback(xhr);
          }
        }, function (xhr) {
          console.error('[WEM] Could not send video event.');

          if (errorCallback) {
            errorCallback(xhr);
          }
        });
      },

      /**
       * This function will invalidate the Apache Unomi session and profile,
       * by removing the associated cookies, set the loaded context to undefined
       * and set the session id cookie with a newly generated ID
       * @return {undefined}
       */
      invalidateSessionAndProfile: function invalidateSessionAndProfile() {

        wem.sessionID = wem.generateGuid() + wem.browserGeneratedSessionSuffix;
        wem.setCookie(wem.trackerSessionIdCookieName, wem.sessionID, 1);
        wem.removeCookie(wem.contextServerCookieName);
        wem.removeCookie(wem.trackerProfileIdCookieName);
        wem.cxs = undefined;
      },

      /**
       * This function return the basic structure for an event, it must be adapted to your need
       *
       * @param {string} eventType The name of your event
       * @param {object} [target] The target object for your event can be build with wem.buildTarget(targetId, targetType, targetProperties)
       * @param {object} [source] The source object for your event can be build with wem.buildSource(sourceId, sourceType, sourceProperties)
       * @returns {object} the event
       */
      buildEvent: function buildEvent(eventType, target, source) {
        var event = {
          eventType: eventType,
          scope: wem.digitalData.scope
        };

        if (target) {
          event.target = target;
        }

        if (source) {
          event.source = source;
        }

        return event;
      },

      /**
       * This function return an event of type form
       *
       * @param {string} formName The HTML name of id of the form to use in the target of the event
       * @param {HTMLFormElement} form optional HTML form element, if provided will be used to extract the form fields and populate the form event
       * @returns {object} the form event
       */
      buildFormEvent: function buildFormEvent(formName) {
        var form = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : undefined;
        var formEvent = wem.buildEvent('form', wem.buildTarget(formName, 'form'), wem.buildSourcePage());
        formEvent.flattenedProperties = {
          fields: form ? wem._extractFormData(form) : {}
        };
        return formEvent;
      },

      /**
       * This function return the source object for a source of type page
       *
       * @returns {object} the target page
       */
      buildTargetPage: function buildTargetPage() {
        return wem.buildTarget(wem.digitalData.page.pageInfo.pageID, 'page', wem.digitalData.page);
      },

      /**
       * This function return the source object for a source of type page
       *
       * @returns {object} the source page
       */
      buildSourcePage: function buildSourcePage() {
        return wem.buildSource(wem.digitalData.page.pageInfo.pageID, 'page', wem.digitalData.page);
      },

      /**
       * This function return the basic structure for the target of your event
       *
       * @param {string} targetId The ID of the target
       * @param {string} targetType The type of the target
       * @param {object} [targetProperties] The optional properties of the target
       * @returns {object} the target
       */
      buildTarget: function buildTarget(targetId, targetType) {
        var targetProperties = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : undefined;
        return wem._buildObject(targetId, targetType, targetProperties);
      },

      /**
       * This function return the basic structure for the source of your event
       *
       * @param {string} sourceId The ID of the source
       * @param {string} sourceType The type of the source
       * @param {object} [sourceProperties] The optional properties of the source
       * @returns {object} the source
       */
      buildSource: function buildSource(sourceId, sourceType) {
        var sourceProperties = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : undefined;
        return wem._buildObject(sourceId, sourceType, sourceProperties);
      },

      /*************************************/

      /* Utility functions under this line */

      /*************************************/

      /**
       * This is an utility function to set a cookie
       *
       * @param {string} cookieName name of the cookie
       * @param {string} cookieValue value of the cookie
       * @param {number} [expireDays] number of days to set the expire date
       * @return {undefined}
       */
      setCookie: function setCookie(cookieName, cookieValue, expireDays) {
        var expires = '';

        if (expireDays) {
          var d = new Date();
          d.setTime(d.getTime() + expireDays * 24 * 60 * 60 * 1000);
          expires = '; expires=' + d.toUTCString();
        }

        document.cookie = cookieName + '=' + cookieValue + expires + '; path=/; SameSite=Strict';
      },

      /**
       * This is an utility function to get a cookie
       *
       * @param {string} cookieName name of the cookie to get
       * @returns {string} the value of the first cookie with the corresponding name or null if not found
       */
      getCookie: function getCookie(cookieName) {
        var name = cookieName + '=';
        var ca = document.cookie.split(';');

        for (var i = 0; i < ca.length; i++) {
          var c = ca[i];

          while (c.charAt(0) == ' ') {
            c = c.substring(1);
          }

          if (c.indexOf(name) == 0) {
            return c.substring(name.length, c.length);
          }
        }

        return null;
      },

      /**
       * This is an utility function to remove a cookie
       *
       * @param {string} cookieName the name of the cookie to rename
       * @return {undefined}
       */
      removeCookie: function removeCookie(cookieName) {

        wem.setCookie(cookieName, '', -1);
      },

      /**
       * This is an utility function to execute AJAX call
       *
       * @param {object} options options of the request
       * @return {undefined}
       */
      ajax: function ajax(options) {
        var xhr = new XMLHttpRequest();

        if ('withCredentials' in xhr) {
          xhr.open(options.type, options.url, options.async);
          xhr.withCredentials = true;
        } else if (typeof XDomainRequest != 'undefined') {
          /* global XDomainRequest */
          xhr = new XDomainRequest();
          xhr.open(options.type, options.url);
        }

        if (options.contentType) {
          xhr.setRequestHeader('Content-Type', options.contentType);
        }

        if (options.dataType) {
          xhr.setRequestHeader('Accept', options.dataType);
        }

        if (options.responseType) {
          xhr.responseType = options.responseType;
        }

        var requestExecuted = false;

        if (wem.timeoutInMilliseconds !== -1) {
          setTimeout(function () {
            if (!requestExecuted) {
              console.error('[WEM] XML request timeout, url: ' + options.url);
              requestExecuted = true;

              if (options.error) {
                options.error(xhr);
              }
            }
          }, wem.timeoutInMilliseconds);
        }

        xhr.onreadystatechange = function () {
          if (!requestExecuted) {
            if (xhr.readyState === 4) {
              if (xhr.status === 200 || xhr.status === 204 || xhr.status === 304) {
                if (xhr.responseText != null) {
                  requestExecuted = true;

                  if (options.success) {
                    options.success(xhr);
                  }
                }
              } else {
                requestExecuted = true;

                if (options.error) {
                  options.error(xhr);
                }

                console.error('[WEM] XML request error: ' + xhr.statusText + ' (' + xhr.status + ')');
              }
            }
          }
        };

        if (options.jsonData) {
          xhr.send(JSON.stringify(options.jsonData));
        } else if (options.data) {
          xhr.send(options.data);
        } else {
          xhr.send();
        }
      },

      /**
       * This is an utility function to generate a new UUID
       *
       * @returns {string} the newly generated UUID
       */
      generateGuid: function generateGuid() {
        function s4() {
          return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
        }

        return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
      },

      /**
       * This is an utility function to check if the local storage is available or not
       * @param {string} type the type of storage to test
       * @returns {boolean} true in case storage is available, false otherwise
       */
      storageAvailable: function storageAvailable(type) {
        try {
          var storage = window[type],
              x = '__storage_test__';
          storage.setItem(x, x);
          storage.removeItem(x);
          return true;
        } catch (e) {
          return false;
        }
      },

      /**
       * Dispatch a JavaScript event in current HTML document
       *
       * @param {string} name the name of the event
       * @param {boolean} canBubble does the event can bubble ?
       * @param {boolean} cancelable is the event cancelable ?
       * @param {*} detail event details
       * @return {undefined}
       */
      dispatchJSEvent: function dispatchJSEvent(name, canBubble, cancelable, detail) {
        var event = document.createEvent('CustomEvent');
        event.initCustomEvent(name, canBubble, cancelable, detail);
        document.dispatchEvent(event);
      },

      /**
       * Fill the wem.digitalData.displayedVariants with the javascript event passed as parameter
       * @param {object} jsEvent javascript event
       * @private
       * @return {undefined}
       */
      _fillDisplayedVariants: function _fillDisplayedVariants(jsEvent) {
        if (!wem.digitalData.displayedVariants) {
          wem.digitalData.displayedVariants = [];
        }

        wem.digitalData.displayedVariants.push(jsEvent);
      },

      /**
       * This is an utility function to get current url parameter value
       *
       * @param {string} name, the name of the parameter
       * @returns {string} the value of the parameter
       */
      getUrlParameter: function getUrlParameter(name) {
        name = name.replace(/[[]/, '\\[').replace(/[\]]/, '\\]');
        var regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
        var results = regex.exec(window.location.search);
        return results === null ? null : decodeURIComponent(results[1].replace(/\+/g, ' '));
      },

      /**
       * convert the passed query string into JS object.
       * @param {string} searchString The URL query string
       * @returns {object} converted URL params
       */
      convertUrlParametersToObj: function convertUrlParametersToObj(searchString) {
        if (!searchString) {
          return null;
        }

        return searchString.replace(/^\?/, '') // Only trim off a single leading interrobang.
        .split('&').reduce(function (result, next) {
          if (next === '') {
            return result;
          }

          var pair = next.split('=');
          var key = decodeURIComponent(pair[0]);
          var value = typeof pair[1] !== 'undefined' && decodeURIComponent(pair[1]) || undefined;

          if (Object.prototype.hasOwnProperty.call(result, key)) {
            // Check to see if this property has been met before.
            if (Array.isArray(result[key])) {
              // Is it already an array?
              result[key].push(value);
            } else {
              // Make it an array.
              result[key] = [result[key], value];
            }
          } else {
            // First time seen, just add it.
            result[key] = value;
          }

          return result;
        }, {});
      },

      /*************************************/

      /* Private functions under this line */

      /*************************************/

      /**
       * Used to override the default digitalData values,
       * the result will impact directly the current instance wem.digitalData
       *
       * @param {object[]} digitalDataOverrides list of overrides
       * @private
       * @return {undefined}
       */
      _handleDigitalDataOverrides: function _handleDigitalDataOverrides(digitalDataOverrides) {
        if (digitalDataOverrides && digitalDataOverrides.length > 0) {
          var _iterator = _createForOfIteratorHelper(digitalDataOverrides),
              _step;

          try {
            for (_iterator.s(); !(_step = _iterator.n()).done;) {
              var digitalDataOverride = _step.value;
              wem.digitalData = wem._deepMergeObjects(digitalDataOverride, wem.digitalData);
            }
          } catch (err) {
            _iterator.e(err);
          } finally {
            _iterator.f();
          }
        }
      },

      /**
       * Check for tracked conditions in the current loaded context, and attach listeners for the known tracked condition types:
       * - formEventCondition
       * - videoViewEventCondition
       * - clickOnLinkEventCondition
       *
       * @private
       * @return {undefined}
       */
      _registerListenersForTrackedConditions: function _registerListenersForTrackedConditions() {
        console.info('[WEM] Check for tracked conditions and attach related HTML listeners');
        var videoNamesToWatch = [];
        var clickToWatch = [];

        if (wem.cxs.trackedConditions && wem.cxs.trackedConditions.length > 0) {
          for (var i = 0; i < wem.cxs.trackedConditions.length; i++) {
            switch (wem.cxs.trackedConditions[i].type) {
              case 'formEventCondition':
                if (wem.cxs.trackedConditions[i].parameterValues && wem.cxs.trackedConditions[i].parameterValues.formId) {
                  wem.formNamesToWatch.push(wem.cxs.trackedConditions[i].parameterValues.formId);
                }

                break;

              case 'videoViewEventCondition':
                if (wem.cxs.trackedConditions[i].parameterValues && wem.cxs.trackedConditions[i].parameterValues.videoId) {
                  videoNamesToWatch.push(wem.cxs.trackedConditions[i].parameterValues.videoId);
                }

                break;

              case 'clickOnLinkEventCondition':
                if (wem.cxs.trackedConditions[i].parameterValues && wem.cxs.trackedConditions[i].parameterValues.itemId) {
                  clickToWatch.push(wem.cxs.trackedConditions[i].parameterValues.itemId);
                }

                break;
            }
          }
        }

        var forms = document.querySelectorAll('form');

        for (var formIndex = 0; formIndex < forms.length; formIndex++) {
          var form = forms.item(formIndex);
          var formName = form.getAttribute('name') ? form.getAttribute('name') : form.getAttribute('id'); // test attribute data-form-id to not add a listener on FF form

          if (formName && wem.formNamesToWatch.indexOf(formName) > -1 && form.getAttribute('data-form-id') == null) {
            // add submit listener on form that we need to watch only
            console.info('[WEM] Watching form ' + formName);
            form.addEventListener('submit', wem._formSubmitEventListener, true);
          }
        }

        for (var videoIndex = 0; videoIndex < videoNamesToWatch.length; videoIndex++) {
          var videoName = videoNamesToWatch[videoIndex];
          var video = document.getElementById(videoName) || document.getElementById(wem._resolveId(videoName));

          if (video) {
            video.addEventListener('play', wem.sendVideoEvent);
            video.addEventListener('ended', wem.sendVideoEvent);
            console.info('[WEM] Watching video ' + videoName);
          } else {
            console.warn('[WEM] Unable to watch video ' + videoName + ', video not found in the page');
          }
        }

        for (var clickIndex = 0; clickIndex < clickToWatch.length; clickIndex++) {
          var clickIdName = clickToWatch[clickIndex];
          var click = document.getElementById(clickIdName) || document.getElementById(wem._resolveId(clickIdName)) ? document.getElementById(clickIdName) || document.getElementById(wem._resolveId(clickIdName)) : document.getElementsByName(clickIdName)[0];

          if (click) {
            click.addEventListener('click', wem.sendClickEvent);
            console.info('[WEM] Watching click ' + clickIdName);
          } else {
            console.warn('[WEM] Unable to watch click ' + clickIdName + ', element not found in the page');
          }
        }
      },

      /**
       * Check for currently registered events in wem.digitalData.events that would be incomplete:
       * - autocomplete the event with the current digitalData page infos for the source
       * @private
       * @return {undefined}
       */
      _checkUncompleteRegisteredEvents: function _checkUncompleteRegisteredEvents() {
        if (wem.digitalData && wem.digitalData.events) {
          var _iterator2 = _createForOfIteratorHelper(wem.digitalData.events),
              _step2;

          try {
            for (_iterator2.s(); !(_step2 = _iterator2.n()).done;) {
              var event = _step2.value;

              wem._completeEvent(event);
            }
          } catch (err) {
            _iterator2.e(err);
          } finally {
            _iterator2.f();
          }
        }
      },

      /**
       * dispatch JavaScript event in current HTML document for perso and opti events contains in digitalData.events
       * @private
       * @return {undefined}
       */
      _dispatchJSExperienceDisplayedEvents: function _dispatchJSExperienceDisplayedEvents() {
        if (wem.digitalData && wem.digitalData.events) {
          var _iterator3 = _createForOfIteratorHelper(wem.digitalData.events),
              _step3;

          try {
            for (_iterator3.s(); !(_step3 = _iterator3.n()).done;) {
              var event = _step3.value;

              if (event.eventType === 'optimizationTestEvent' || event.eventType === 'personalizationEvent') {
                wem._dispatchJSExperienceDisplayedEvent(event);
              }
            }
          } catch (err) {
            _iterator3.e(err);
          } finally {
            _iterator3.f();
          }
        }
      },

      /**
       * build and dispatch JavaScript event in current HTML document for the given Unomi event (perso/opti)
       * @private
       * @param {object} experienceUnomiEvent perso/opti Unomi event
       * @return {undefined}
       */
      _dispatchJSExperienceDisplayedEvent: function _dispatchJSExperienceDisplayedEvent(experienceUnomiEvent) {
        if (!wem.fallback && experienceUnomiEvent && experienceUnomiEvent.target && experienceUnomiEvent.target.properties && experienceUnomiEvent.target.properties.variants && experienceUnomiEvent.target.properties.variants.length > 0) {
          var typeMapper = {
            optimizationTestEvent: 'optimization',
            personalizationEvent: 'personalization'
          };

          var _iterator4 = _createForOfIteratorHelper(experienceUnomiEvent.target.properties.variants),
              _step4;

          try {
            for (_iterator4.s(); !(_step4 = _iterator4.n()).done;) {
              var variant = _step4.value;
              var jsEventDetail = {
                id: variant.id,
                name: variant.systemName,
                displayableName: variant.displayableName,
                path: variant.path,
                type: typeMapper[experienceUnomiEvent.eventType],
                variantType: experienceUnomiEvent.target.properties.type,
                tags: variant.tags,
                nodeType: variant.nodeType,
                wrapper: {
                  id: experienceUnomiEvent.target.itemId,
                  name: experienceUnomiEvent.target.properties.systemName,
                  displayableName: experienceUnomiEvent.target.properties.displayableName,
                  path: experienceUnomiEvent.target.properties.path,
                  tags: experienceUnomiEvent.target.properties.tags,
                  nodeType: experienceUnomiEvent.target.properties.nodeType
                }
              };

              if (experienceUnomiEvent.eventType === 'personalizationEvent') {
                jsEventDetail.wrapper.inControlGroup = experienceUnomiEvent.target.properties.inControlGroup;
              }

              wem._fillDisplayedVariants(jsEventDetail);

              wem.dispatchJSEvent('displayWemVariant', false, false, jsEventDetail);
            }
          } catch (err) {
            _iterator4.e(err);
          } finally {
            _iterator4.f();
          }
        }
      },

      /**
       * Filter events in digitalData.events that would have the property: event.properties.doNotSendToUnomi
       * The effect is directly stored in a new version of wem.digitalData.events
       * @private
       * @return {undefined}
       */
      _filterUnomiEvents: function _filterUnomiEvents() {
        if (wem.digitalData && wem.digitalData.events) {
          wem.digitalData.events = wem.digitalData.events.filter(function (event) {
            return !event.properties || !event.properties.doNotSendToUnomi;
          }).map(function (event) {
            if (event.properties) {
              delete event.properties.doNotSendToUnomi;
            }

            return event;
          });
        }
      },

      /**
       * Check if event is incomplete and complete what is missing:
       * - source: if missing, use the current source page
       * - scope: if missing, use the current scope
       * @param {object} event, the event to be checked
       * @private
       * @return {object} the complete event
       */
      _completeEvent: function _completeEvent(event) {
        if (!event.source) {
          event.source = wem.buildSourcePage();
        }

        if (!event.scope) {
          event.scope = wem.digitalData.scope;
        }

        if (event.target && !event.target.scope) {
          event.target.scope = wem.digitalData.scope;
        }

        return event;
      },

      /**
       * Register an event in the wem.digitalData.events.
       * Registered event, will be sent automatically during the context loading process.
       *
       * Beware this function is useless in case the context is already loaded.
       * in case the context is already loaded (check: wem.getLoadedContext()), then you should use: wem.collectEvent(s) functions
       *
       * @private
       * @param {object} event the Unomi event to be registered
       * @param {boolean} unshift optional, if true, the event will be added at the beginning of the list otherwise at the end of the list. (default: false)
       * @return {undefined}
       */
      _registerEvent: function _registerEvent(event) {
        var unshift = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

        if (wem.digitalData) {
          if (wem.cxs) {
            console.error('[WEM] already loaded, too late...');
            return;
          }
        } else {
          wem.digitalData = {};
        }

        wem.digitalData.events = wem.digitalData.events || [];

        if (unshift) {
          wem.digitalData.events.unshift(event);
        } else {
          wem.digitalData.events.push(event);
        }
      },

      /**
       * This function allow for registering callback that will be executed once the context is loaded.
       * @param {function} onLoadCallback the callback to be executed
       * @param {string} name optional name for the call, used mostly for logging the execution
       * @param {number} priority optional priority to execute the callbacks in a specific order
       *                          (default: 5, to leave room for the tracker default callback(s))
       * @private
       * @return {undefined}
       */
      _registerCallback: function _registerCallback(onLoadCallback) {
        var name = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : undefined;
        var priority = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 5;

        if (wem.digitalData) {
          if (wem.cxs) {
            console.info('[WEM] Trying to register context load callback, but context already loaded, executing now...');

            if (onLoadCallback) {
              console.info('[WEM] executing context load callback: ' + (name ? name : 'Callback without name'));
              onLoadCallback(wem.digitalData);
            }
          } else {
            console.info('[WEM] registering context load callback: ' + (name ? name : 'Callback without name'));

            if (onLoadCallback) {
              wem.digitalData.loadCallbacks = wem.digitalData.loadCallbacks || [];
              wem.digitalData.loadCallbacks.push({
                priority: priority,
                name: name,
                execute: onLoadCallback
              });
            }
          }
        } else {
          console.info('[WEM] Trying to register context load callback, but no digitalData conf found, creating it and registering the callback: ' + (name ? name : 'Callback without name'));
          wem.digitalData = {};

          if (onLoadCallback) {
            wem.digitalData.loadCallbacks = [];
            wem.digitalData.loadCallbacks.push({
              priority: priority,
              name: name,
              execute: onLoadCallback
            });
          }
        }
      },

      /**
       * Internal function for personalization specific callbacks (used for HTML dom manipulation once we get the context loaded)
       * @param {object} personalization the personalization
       * @param {function} callback the callback
       * @private
       * @return {undefined}
       */
      _registerPersonalizationCallback: function _registerPersonalizationCallback(personalization, callback) {
        if (wem.digitalData) {
          if (wem.cxs) {
            console.error('[WEM] already loaded, too late...');
          } else {
            console.info('[WEM] digitalData object present but not loaded, registering sort callback...');
            wem.digitalData.personalizationCallback = wem.digitalData.personalizationCallback || [];
            wem.digitalData.personalizationCallback.push({
              personalization: personalization,
              callback: callback
            });
          }
        } else {
          wem.digitalData = {};
          wem.digitalData.personalizationCallback = wem.digitalData.personalizationCallback || [];
          wem.digitalData.personalizationCallback.push({
            personalization: personalization,
            callback: callback
          });
        }
      },

      /**
       * Build a simple Unomi object
       * @param {string} itemId the itemId of the object
       * @param {string} itemType the itemType of the object
       * @param {object} properties optional properties for the object
       * @private
       * @return {object} the built Unomi JSON object
       */
      _buildObject: function _buildObject(itemId, itemType) {
        var properties = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : undefined;
        var object = {
          scope: wem.digitalData.scope,
          itemId: itemId,
          itemType: itemType
        };

        if (properties) {
          object.properties = properties;
        }

        return object;
      },

      /**
       * Main callback used once the Ajax context request succeed
       * @param {XMLHttpRequest} xhr the request
       * @private
       * @return {undefined}
       */
      _onSuccess: function _onSuccess(xhr) {
        wem.cxs = JSON.parse(xhr.responseText);

        if (wem.digitalData.loadCallbacks && wem.digitalData.loadCallbacks.length > 0) {
          console.info('[WEM] Found context server load callbacks, calling now...');

          wem._executeLoadCallbacks(wem.digitalData);

          if (wem.digitalData.personalizationCallback) {
            for (var j = 0; j < wem.digitalData.personalizationCallback.length; j++) {
              if (wem.cxs.personalizationResults) {
                // Since Unomi 2.1.0 personalization results are available with more infos
                var personalizationResult = wem.cxs.personalizationResults[wem.digitalData.personalizationCallback[j].personalization.id];
                wem.digitalData.personalizationCallback[j].callback(personalizationResult.contentIds, personalizationResult.additionalResultInfos);
              } else {
                // probably a version older than Unomi 2.1.0, fallback to old personalization results
                wem.digitalData.personalizationCallback[j].callback(wem.cxs.personalizations[wem.digitalData.personalizationCallback[j].personalization.id]);
              }
            }
          }
        }
      },

      /**
       * Main callback used once the Ajax context request failed
       * @param {string} logMessage the log message, to identify the place of failure
       * @private
       * @return {undefined}
       */
      _executeFallback: function _executeFallback(logMessage) {
        console.warn('[WEM] execute fallback' + (logMessage ? ': ' + logMessage : '') + ', load fallback callbacks, calling now...');
        wem.fallback = true;
        wem.cxs = {};

        wem._executeLoadCallbacks(undefined);

        if (wem.digitalData.personalizationCallback) {
          for (var i = 0; i < wem.digitalData.personalizationCallback.length; i++) {
            wem.digitalData.personalizationCallback[i].callback([wem.digitalData.personalizationCallback[i].personalization.strategyOptions.fallback]);
          }
        }
      },

      /**
       * Executed the registered context loaded callbacks
       * @param {*} callbackParam param of the callbacks
       * @private
       * @return {undefined}
       */
      _executeLoadCallbacks: function _executeLoadCallbacks(callbackParam) {
        if (wem.digitalData.loadCallbacks && wem.digitalData.loadCallbacks.length > 0) {
          wem.digitalData.loadCallbacks.sort(function (a, b) {
            return a.priority - b.priority;
          }).forEach(function (loadCallback) {
            console.info('[WEM] executing context load callback: ' + (loadCallback.name ? loadCallback.name : 'callback without name'));
            loadCallback.execute(callbackParam);
          });
        }
      },

      /**
       * Parse current HTML document referrer information to enrich the digitalData page infos
       * @private
       * @return {undefined}
       */
      _processReferrer: function _processReferrer() {
        var referrerURL = wem.digitalData.page.pageInfo.referringURL || document.referrer;
        var sameDomainReferrer = false;

        if (referrerURL) {
          // parse referrer URL
          var referrer = new URL(referrerURL); // Set sameDomainReferrer property

          sameDomainReferrer = referrer.host === window.location.host; // only process referrer if it's not coming from the same site as the current page

          if (!sameDomainReferrer) {
            // get search element if it exists and extract search query if available
            var search = referrer.search;
            var query = undefined;

            if (search && search != '') {
              // parse parameters
              var queryParams = [],
                  param;
              var queryParamPairs = search.slice(1).split('&');

              for (var i = 0; i < queryParamPairs.length; i++) {
                param = queryParamPairs[i].split('=');
                queryParams.push(param[0]);
                queryParams[param[0]] = param[1];
              } // try to extract query: q is Google-like (most search engines), p is Yahoo


              query = queryParams.q || queryParams.p;
              query = decodeURIComponent(query).replace(/\+/g, ' ');
            } // register referrer event
            // Create deep copy of wem.digitalData.page and add data to pageInfo sub object


            if (wem.digitalData && wem.digitalData.page && wem.digitalData.page.pageInfo) {
              wem.digitalData.page.pageInfo.referrerHost = referrer.host;
              wem.digitalData.page.pageInfo.referrerQuery = query;
            }
          }
        }

        wem.digitalData.page.pageInfo.sameDomainReferrer = sameDomainReferrer;
      },

      /**
       * Listener callback that can be attached to a specific HTML form,
       * this listener will automatically send the form event to Unomi, by parsing the HTML form data.
       * (NOTE: the form listener only work for know forms to be watch due to tracked conditions)
       *
       * @param {object} event the original HTML form submition event for the watch form.
       * @private
       * @return {undefined}
       */
      _formSubmitEventListener: function _formSubmitEventListener(event) {
        console.info('[WEM] Registering form event callback');
        var form = event.target;
        var formName = form.getAttribute('name') ? form.getAttribute('name') : form.getAttribute('id');

        if (formName && wem.formNamesToWatch.indexOf(formName) > -1) {
          console.info('[WEM] catching form ' + formName);
          var eventCopy = document.createEvent('Event'); // Define that the event name is 'build'.

          eventCopy.initEvent('submit', event.bubbles, event.cancelable);
          event.stopImmediatePropagation();
          event.preventDefault();
          wem.collectEvent(wem.buildFormEvent(formName, form), function () {
            form.removeEventListener('submit', wem._formSubmitEventListener, true);
            form.dispatchEvent(eventCopy);

            if (!eventCopy.defaultPrevented && !eventCopy.cancelBubble) {
              form.submit();
            }

            form.addEventListener('submit', wem._formSubmitEventListener, true);
          }, function (xhr) {
            console.error('[WEM] Error while collecting form event: ' + xhr.status + ' ' + xhr.statusText);
            xhr.abort();
            form.removeEventListener('submit', wem._formSubmitEventListener, true);
            form.dispatchEvent(eventCopy);

            if (!eventCopy.defaultPrevented && !eventCopy.cancelBubble) {
              form.submit();
            }

            form.addEventListener('submit', wem._formSubmitEventListener, true);
          });
        }
      },

      /**
       * Utility function to extract data from an HTML form.
       *
       * @param {HTMLFormElement} form the HTML form element
       * @private
       * @return {object} the form data as JSON
       */
      _extractFormData: function _extractFormData(form) {
        var params = {};

        for (var i = 0; i < form.elements.length; i++) {
          var e = form.elements[i]; // ignore empty and undefined key (e.name)

          if (e.name) {
            switch (e.nodeName) {
              case 'TEXTAREA':
              case 'INPUT':
                switch (e.type) {
                  case 'checkbox':
                    var checkboxes = document.querySelectorAll('input[name="' + e.name + '"]');

                    if (checkboxes.length > 1) {
                      if (!params[e.name]) {
                        params[e.name] = [];
                      }

                      if (e.checked) {
                        params[e.name].push(e.value);
                      }
                    }

                    break;

                  case 'radio':
                    if (e.checked) {
                      params[e.name] = e.value;
                    }

                    break;

                  default:
                    if (!e.value || e.value == '') {
                      // ignore element if no value is provided
                      break;
                    }

                    params[e.name] = e.value;
                }

                break;

              case 'SELECT':
                if (e.options && e.options[e.selectedIndex]) {
                  if (e.multiple) {
                    params[e.name] = [];

                    for (var j = 0; j < e.options.length; j++) {
                      if (e.options[j].selected) {
                        params[e.name].push(e.options[j].value);
                      }
                    }
                  } else {
                    params[e.name] = e.options[e.selectedIndex].value;
                  }
                }

                break;
            }
          }
        }

        return params;
      },

      /**
       * Internal function used for mapping ids when current HTML document ids doesn't match ids stored in Unomi backend
       * @param {string} id the id to resolve
       * @return {string} the resolved id or the original id if not match found
       * @private
       */
      _resolveId: function _resolveId(id) {
        if (wem.digitalData.sourceLocalIdentifierMap) {
          var source = Object.keys(wem.digitalData.sourceLocalIdentifierMap).filter(function (source) {
            return id.indexOf(source) > 0;
          });
          return source ? id.replace(source, wem.digitalData.sourceLocalIdentifierMap[source]) : id;
        }

        return id;
      },

      /**
       * Enable or disable tracking in current page
       * @param {boolean} enable true will enable the tracking feature, otherwise they will be disabled
       * @param {function} callback an optional callback that can be used to perform additional logic based on enabling/disabling results
       * @private
       * @return {undefined}
       */
      _enableWem: function _enableWem(enable) {
        var callback = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : undefined;
        // display fallback if wem is not enable
        wem.fallback = !enable; // remove cookies, reset cxs

        if (!enable) {
          wem.cxs = {};
          document.cookie = wem.trackerProfileIdCookieName + '=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
          document.cookie = wem.contextServerCookieName + '=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
          delete wem.contextLoaded;
        } else {
          if (wem.DOMLoaded) {
            wem.loadContext();
          } else {
            // As Dom loaded listener not triggered, enable global value.
            wem.activateWem = true;
          }
        }

        if (callback) {
          callback(enable);
        }

        console.log("[WEM] successfully ".concat(enable ? 'enabled' : 'disabled', " tracking in current page"));
      },

      /**
       * Utility function used to merge two JSON object together (arrays are concat for example)
       * @param {object} source the source object for merge
       * @param {object} target the target object for merge
       * @private
       * @return {object} the merged results
       */
      _deepMergeObjects: function _deepMergeObjects(source, target) {
        if (!wem._isObject(target) || !wem._isObject(source)) {
          return source;
        }

        Object.keys(source).forEach(function (key) {
          var targetValue = target[key];
          var sourceValue = source[key]; // concat arrays || merge objects || add new props

          if (Array.isArray(targetValue) && Array.isArray(sourceValue)) {
            target[key] = targetValue.concat(sourceValue);
          } else if (wem._isObject(targetValue) && wem._isObject(sourceValue)) {
            target[key] = wem._deepMergeObjects(sourceValue, Object.assign({}, targetValue));
          } else {
            target[key] = sourceValue;
          }
        });
        return target;
      },

      /**
       * Utility function used to check if the given variable is a JavaScript object.
       * @param {*} obj the variable to check
       * @private
       * @return {boolean} true if the variable is an object, false otherwise
       */
      _isObject: function _isObject(obj) {
        return obj && _typeof(obj) === 'object';
      }
    };
    return wem;
  };

  /*
   * Licensed to the Apache Software Foundation (ASF) under one or more
   * contributor license agreements.  See the NOTICE file distributed with
   * this work for additional information regarding copyright ownership.
   * The ASF licenses this file to You under the Apache License, Version 2.0
   * (the "License"); you may not use this file except in compliance with
   * the License.  You may obtain a copy of the License at
   *
   *      http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   */
  var useTracker = function useTracker() {
    return newTracker();
  };

  exports.useTracker = useTracker;

  Object.defineProperty(exports, '__esModule', { value: true });

}));
//# sourceMappingURL=apache-unomi-tracker.umd.js.map
