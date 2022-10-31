/*
 * scene.js
 * 
 * @author Sashi Vadakkepat - sashi@punchdialog.com
 * 
 */

  var params, ios;  
  var contentWindow;

  
  // parse the url string for params to 
  // be used in app configuration
  function getParams(){
    
    // iOS iframe auto-resize workaround
    if (/(iPad|iPhone|iPod)/g.test( navigator.userAgent)){
        var viewer = document.getElementById('ifr');
        var w = getComputedStyle( viewer ).width;
        var h = getComputedStyle( viewer ).height;
        viewer.style.width = w;
        viewer.style.height = h;        
        viewer.setAttribute( 'scrolling', 'no' );
        ios = true;
    }
    else{
        ios = false;
    }
            
	var idx = document.URL.indexOf('?');
	var params = new Array();
	if (idx != -1) {
		var pairs = document.URL.substring(idx+1, document.URL.length).split('&');
		for (var i=0; i<pairs.length; i++){
			nameVal = pairs[i].split('=');
			params[nameVal[0]] = nameVal[1];
		}
	}		
	return params;
  }	
    
  function getIOS(){
      return ios;
  }		 
  
  function onSceneReady(){
    
		params = getParams();		
        contentWindow = $("#ifr")[0].contentWindow;        

		// disable interactions
		contentWindow.removeEventListeners();
		
        setMeasurementSystem();                                                   
        setLightingParameters();
		
		// import the project if needed					
		if(params['projectid']){
		}
		else{               			
			contentWindow.addEventListeners();		
		}				            
		
		contentWindow.render();				
}

function onWindowLoaded(){
    contentWindow = $("#ifr")[0].contentWindow;
    setFocus();
    this.addEventListener('mousemove', function(e){
        contentWindow.onMouseMove(e);
    });

    $( window ).resize(function() {			
        //positionAllToolbars();			
    });			
    contentWindow.switchCamera("orthographic");																		
}
    
function onSave(){        
}

////////////////////////////////////////////////////////////////

function setupToolbars(){		
    setupModeToolbar();
    setupCameraToolbar();		    
    setupNavigationToolbar();    
    setupTrashCan();
    if(params['embedded'] || params['shared']){
        $('#save-btn').addClass("disabled");			
    }
}

function modeHelper(){		
    setFocus();	
}

function setupModeToolbar(){	

    document.getElementById("mode-dot").addEventListener("click", function () {
        contentWindow.setActionStateDot();			
        modeHelper();
    }, false);
    
    document.getElementById("mode-dash").addEventListener("click", function () {
        contentWindow.setActionStateDash();
        modeHelper();
    }, false);        		
}
        
function setupCameraToolbar(){
    document.getElementById("camera-2d").addEventListener("click", function () {						
        contentWindow.switchCamera("orthographic");			
        setFocus();
    }, false);

    document.getElementById("camera-3d").addEventListener("click", function () {			
        contentWindow.switchCamera("perspective");			
        setFocus();
    }, false);		    
}		   	   	    



function navActionUI(id){
    contentWindow.navActionScn(id, 0.1);		
}

function setupNavigationToolbar(){

    document.getElementById("nav-reset").addEventListener("click", function () {			
        contentWindow.resetCamera();
    });		
}

function setupTrashCan(){ 
    document.getElementById("trash-btn").addEventListener("click", function () {			
        contentWindow.clear();
    });		
}
        
setFocus = function(){
    contentWindow.focus();
}
                
