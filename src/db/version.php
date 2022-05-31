<?php

class Version {

    /**
     *
     * @var Array This is array on JavaScript
     */
    private $jsArray = array();
    private $jsDashArray = array();
    private $jsSocialArray = array();
        
    /**
     *
     * @var Array This is array on CSS 3
     */
    private $cssArray = array();
    private $cssDashArray = array();
    private $cssSocialArray = array();

    public function __construct() {
        $this->setJsArray();
        $this->setJsDashArray();
        $this->setJsSocialArray();
        
        $this->setCssArray();
        $this->setCssDashArray();
        $this->setCssSocialArray();
    }
    
    public function setJsArray() {
        $this->jsArray = include __DIR__ . '/../config/version/jsFront.php';
    }
    
    public function setJsDashArray() {
        $this->jsDashArray = include __DIR__ . '/../config/version/jsDash.php';
    }
    
    public function setJsSocialArray() {
        $this->jsSocialArray = include __DIR__ . '/../config/version/jsSocial.php';
    }
    
    public function setCssArray() {
        $this->cssArray = include __DIR__ . '/../config/version/cssFront.php';
    }
    
    public function setCssDashArray() {
        $this->cssDashArray = include __DIR__ . '/../config/version/cssDash.php';
    }
    
    public function setCssSocialArray() {
        $this->cssSocialArray = include __DIR__ . '/../config/version/cssSocial.php';
    }

    public function getAllJavaScript() {
        foreach ($this->jsArray as $k=>$list) {
           Version::echoUrl($k);
        }
    }

    public function getAllCSS() {
        foreach ($this->cssArray as $k=>$cssVal) {
           Version::echoUrl($k, true);
        }
    }

    public function getJavaScript($arrayList) {
        foreach ($arrayList as $k=>$list) {
           Version::echoUrl($list);
        }
    }

    public function getJavaScriptDash($arrayList) {
        foreach ($arrayList as $k=>$list) {
           Version::echoUrl($list);
        }
    }

    public function getJavaScriptSocial($arrayList) {
        foreach ($arrayList as $k=>$list) {
           Version::echoUrl($list);
        }
    }

    public function getCss($arrayList) {
        foreach ($arrayList as $k=>$list) {
           Version::echoUrl($list, true);
        }
    }

    public function getSocialCss($arrayList) {
        foreach ($arrayList as $k=>$list) {
           Version::echoUrl($list, true);
        }
    }

    public function getDashCss($arrayList) {
        foreach ($arrayList as $k=>$list) {
           Version::echoUrl($list, true);
        }
    }

    public function getCssUri($uri) {
        foreach ($this->cssArray as $k => $list) {
            if (array_key_exists('uri', $list) && $this->cssArray[$k]['uri'] == 'all' || in_array($uri, $this->cssArray[$k]['uri'])) {
               Version::echoUrl($k, true);
            }
        }
    }

    public function getCssDashUri($uri) {
        foreach ($this->cssDashArray as $k => $list) {
            if (array_key_exists('uri', $list) && $this->cssDashArray[$k]['uri'] == 'all' || (array_key_exists('uri', $list) && is_array($this->cssDashArray[$k]['uri']) && in_array($uri, $this->cssDashArray[$k]['uri']))) {
               Version::echoUrl($k, true);
            }
        }
    }

    public function getCssSocialUri($uri) {
        foreach ($this->cssSocialArray as $k => $list) {
            if (array_key_exists('uri', $list) && $this->cssSocialArray[$k]['uri'] == 'all' || (array_key_exists('uri', $list) && is_array($this->cssSocialArray[$k]['uri']) && in_array($uri, $this->cssSocialArray[$k]['uri']))) {
               Version::echoUrl($k, true);
            }
        }
    }

    public function getJavaScriptUri($uri) {
        foreach ($this->jsArray as $k => $list) {
            if (array_key_exists('uri', $list) && $this->jsArray[$k]['uri'] == 'all' || in_array($uri, $this->jsArray[$k]['uri'])) {
               Version::echoUrl($k);
            }
        }
    }

    public function getJavaScriptDashUri($uri) {
        foreach ($this->jsDashArray as $k => $list) {
            if (array_key_exists('uri', $list) && $this->jsDashArray[$k]['uri'] == 'all' || (array_key_exists('uri', $list) && is_array($this->jsDashArray[$k]['uri']) && in_array($uri, $this->jsDashArray[$k]['uri']))) {
               Version::echoUrl($k);
            }
        }
    }

    public function getJavaScriptSocialUri($uri) {
        foreach ($this->jsSocialArray as $k => $list) {
            if (array_key_exists('uri', $list) && $this->jsSocialArray[$k]['uri'] == 'all' || (array_key_exists('uri', $list) && is_array($this->jsSocialArray[$k]['uri']) && in_array($uri, $this->jsSocialArray[$k]['uri']))) {
               Version::echoUrl($k);
            }
        }
    }

    public static function echoUrl($urlObj, $css = false) {
        $fileUrl = $urlObj;//$urlObj['path'] . $urlObj['name'] . '.' . $urlObj['type'];
        $cacheSum = sha1(filemtime(__DIR__ . $fileUrl));
        if ($css) {
            echo "<link rel=\"stylesheet\" href=\"{$fileUrl}?{$cacheSum}\">";
        } else {
            echo "<script src=\"{$fileUrl}?{$cacheSum}\"></script>";
        }
    }

}
