/*
 * scene.js
 * 
 * @author Sashi Vadakkepat - sashi@punchdialog.com
 * 
 */


// window sizes
    var windowWidth, windowHeight;

    // the renderer
    var renderer;

    // the scene layers
    var scene0;     // this will contain the base plane
    var scene;      // this will contain the solid primitives
    var scene2;     // this will contain measurements & all other controls    

    // cameras
    var camera;
    var perspCamera;
    var orthoCamera;
    var currentCameraType = "perspective";       

    // orbit controls
    var controls;
    var perspControls;
    var orthoControls;
     
    var referenceFrame;
    var box = new THREE.Box3(new THREE.Vector3(-20,0,-20), new THREE.Vector3(20,0,20));
    var lightBox = new THREE.Box3(new THREE.Vector3(-50,0,-50), new THREE.Vector3(50,0,50));
    var center = box.getCenter(new THREE.Vector3());

    // base plane
    var plane;
        
    // action states
    var actionStates = { DOT: 0, DASH:1 };
    
    var actionState = actionStates.DOT;
    
    var lastPoint = null;
    var pos = null;
    
    // mouse
    var mouse  = new THREE.Vector2(); 
    var lastMousePos, mousePos;    

    // track that the mouse events originated in the 3DView
    var mouseDown = false;

    // handle mouse out
    var mouseOut = false;

    // selection
    var raycaster;         
    
    // lighting rig
    var lights;

    // Dots
    var dots = new Dots();
            
    ////////////////////////////////////////////////////////////////
    // init
    ////////////////////////////////////////////////////////////////

    function init() {                
        windowWidth = window.innerWidth; windowHeight = window.innerHeight;

        // create the scenes, that will hold all our elements such as objects, cameras and lights.
        scene0 = new THREE.Scene();   
        scene = new THREE.Scene();   
        scene2 = new THREE.Scene();          

        // create a render and set the size
        //renderer = new THREE.WebGLRenderer({antialias: true});
        renderer = new THREE.WebGLRenderer();
        
        renderer.setClearColor(new THREE.Color(0xFFFFFF));        
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.autoClear = false;
        
        // shadow map
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;        
        renderer.shadowMapSoft = true;

        renderer.outputEncoding = THREE.GammaEncoding;
        renderer.gammaFactor = 2.2;
                
        // create the cameras
        createCamerasAndControls();
        camera = perspCamera;   
        controls = perspControls;        

        orthoControls.enabled = true;        
        perspControls.enabled = true;               
        
        // add the lighting rig to the main scene
        lights = new Lights(lightBox, scene);
        

        // add a simple ambient light to the top most scene
        // that will contain measurements, ink and suites
        scene2.add(new THREE.AmbientLight(0xffffff, 1.0));
                
        // create the ground plane
        var planeGeometry = new THREE.PlaneGeometry(20000, 20000, 1, 1);
        var planeMaterial = new THREE.MeshLambertMaterial({color: 0x0000ff, transparent: true, opacity: 0.0});
        plane = new THREE.Mesh(planeGeometry, planeMaterial);        
        plane.rotation.x = -0.5 * Math.PI;
        scene0.add(plane);

        // and the raycaster
        raycaster = new THREE.Raycaster();    
        raycaster.params.Line.threshold = 0.1;            
                  
        // frame of reference 
        referenceFrame = new THREE.AxesHelper();
        scene.add(referenceFrame);         
                
        // add the output of the renderer to the html element
        document.getElementById("WebGL-output").appendChild(renderer.domElement);                                                    
                
        const color = {
            value: 0x888888
        };
        const grid = new THREE.InfiniteGridHelper(1, 10, new THREE.Color(color));        
        grid.material.uniforms.uColor.value.set( color.value );
        scene.add(grid);              
        
        initDots();
        setActionStateDash();
        
        render();
    }                    

    function createPerspectiveCamerasAndControls(){
        var size = box.getSize(new THREE.Vector3());
        var max = Math.max(size.x, size.y, size.z);
        // set up the perspective camera
        var fov = 45;
        perspCamera = new THREE.PerspectiveCamera(fov, window.innerWidth / window.innerHeight, 1, 1000);                        

        // initially set the position of the perspective camera in front of the model
        // and set the up vector to (0, 1, 0) so that the orbit control can be correctly initialized
        perspCamera.position.x = center.x;
        perspCamera.position.y = 0;
        perspCamera.position.z = center.z + 2.0 * max;  
        perspCamera.up = new THREE.Vector3(0, 1, 0);      

        // persp trackball controls 
        perspControls = new THREE.OrbitControls( perspCamera, renderer.domElement );        
        perspControls.zoomCallback = onMouseWheel;

        perspControls.minPolarAngle = 0;            // radians
        perspControls.maxPolarAngle = Math.PI/2;    // radians
        
        perspControls.maxDistance = perspCamera.far * 0.5;
        perspControls.rotateSpeed = 1.0;
        perspControls.zoomSpeed = 1.2;
        perspControls.panSpeed = 0.8;
        perspControls.target.set(center.x, center.y, center.z);
        perspControls.addEventListener( 'change', function(){                        
        });             

        // once the orbit controls have been created, set the position
        // of the perspective camera to a top view.

        var h = max * 1.25;
        var dist = h/(Math.tan(fov * Math.PI/360))/8;

        perspCamera.position.x = center.x;
        perspCamera.position.y = dist;//(center.y + 1.79 * max);
        perspCamera.position.z = center.z;                 

        // set the reset data for the controls
        perspControls.setResetData(center, perspCamera.position, perspCamera.zoom);                                                
        perspCamera.lookAt(center);        
    }

    function createOrthographicsCamerasAndControls(){
        var size = box.getSize(new THREE.Vector3());
        var viewSize = Math.max(size.x, size.y, size.z) * 1.25;
        var aspectRatio = window.innerWidth/ window.innerHeight;
        //setup the orthographic camera 

        var den = 8;

        orthoCamera = new THREE.OrthographicCamera(-aspectRatio * viewSize/den , aspectRatio * viewSize/den , viewSize/den, -viewSize/den, -2000, 50000);        

        // position
        orthoCamera.position.x = center.x;
        orthoCamera.position.y = 0;
        orthoCamera.position.z = center.z + 1.2 * viewSize;          
        orthoCamera.up = new THREE.Vector3(0, 1, 0);                   

        // ortho trackball controls
        orthoControls = new THREE.OrbitControls( orthoCamera, renderer.domElement );
        orthoControls.zoomCallback = onMouseWheel;

        orthoControls.minPolarAngle = 0; // radians
        orthoControls.maxPolarAngle = 0; // radians
        
        orthoControls.minZoom = 0.145;
        orthoControls.rotateSpeed = 1.0;
        orthoControls.zoomSpeed = 1.2;
        orthoControls.panSpeed = 0.8;
        orthoControls.target.set(center.x, center.y, center.z);
        orthoControls.addEventListener( 'change', function(){                        
        });     

        // set the reset data for the controls
        orthoControls.setResetData(center, perspCamera.position, perspCamera.zoom);        
        orthoCamera.lookAt(center);
    }    
    
    // setup all the cameras

    function createCamerasAndControls(){
        createPerspectiveCamerasAndControls();
        createOrthographicsCamerasAndControls();        
    }                  

    function render() {                
        renderer.clear();        
        renderer.render( scene0, camera );
        renderer.clearDepth();
        renderer.render( scene, camera );
        renderer.clearDepth();
        renderer.render( scene2, camera);        
    }          

    function onResize() {            
        windowWidth = window.innerWidth; windowHeight = window.innerHeight;

        // update ortho camera
        var den = 32;            
        orthoCamera.left = -window.innerWidth / den;
        orthoCamera.right = window.innerWidth / den;
        orthoCamera.top = window.innerHeight / den;
        orthoCamera.bottom = -window.innerHeight / den;        
        orthoCamera.updateProjectionMatrix();        

        // update persp camera
        perspCamera.aspect = window.innerWidth / window.innerHeight;
        perspCamera.updateProjectionMatrix();
        
        // update renderer
        renderer.setSize( window.innerWidth, window.innerHeight );        
    }

    function animate() {
        requestAnimationFrame( animate );        
        TWEEN.update();
        render();
    }    

    function resetCamera(){                
        createCamerasAndControls();        

        if(currentCameraType == "perspective"){
            camera = perspCamera;            
        }
        else if(currentCameraType == "orthographic"){
            camera = orthoCamera;            
        }        
        
        perspControls.reset();
        perspControls.update();        

        orthoControls.reset();
        orthoControls.update();              
    }

    function switchCamera(newCameraType) {        
        if(newCameraType == "perspective"){            
            if(currentCameraType != "perspective"){                            
                perspControls.maxPolarAngle = Math.PI/2;                                
                camera = perspCamera;
                controls = perspControls;                                
            }
        }
        else if(newCameraType == "orthographic"){            
            if(currentCameraType != "orthographic"){                
                perspControls.maxPolarAngle = 0;                
                camera = orthoCamera;
                controls = orthoControls;                                
            }                
        }        

        currentCameraType = newCameraType;          
        controls.update();                 
    };    

    var snapPos = null;
    const circleGeometry = new THREE.CircleGeometry( 0.08, 32 );
    const circleMaterial = new THREE.MeshBasicMaterial( { color: 0x888888 } );    
    const circleHighlightMaterial = new THREE.MeshBasicMaterial( { color: 0x880000 } );    
    var circle = null;        
    var circleHighlight = null;

    const circleStrokeGeometry = new THREE.CircleGeometry( 0.04, 32 );
    var circleStroke1 = null;
    var circleStroke2 = null;        
    var stroke = null;    

    var targets = [];
    var targetNodes = null;
    var startNode = null;
    var prevNode = null;

    function initDots(){
        for(var i = -2; i <= 2; ++i){
            for(var j = -2; j <= 2; ++j){
                var dot = dots.addDot(new THREE.Vector3(i, 0, j));
                if(dot){
                    scene.add(dot);
                }
            }
        }
    }

    // mouse events    
    var dragged = false;
    function down(event, x, y)
    {          
        mouseDown = true;
        dragged = false;                
                        
        lastMousePos = new THREE.Vector2(x, y);
        mousePos = new THREE.Vector2(x, y);            
        lastPoint = get3dPointZAxis(plane);          
        switch(actionState){
            case actionStates.DOT:                
                break;
            case actionStates.DASH:      
                if(stroke)
                    stroke = null;    
                startNode = nearestNode;
                updateStartNode();
                break;                
        }        
    }

    function updateStartNode(){        
        if(targets.length){
            targets.forEach(function(t){
                scene.remove(t);
            });                        
        }

        if(startNode){                                        
            targetNodes = dots.getNextCandidateNodes(snapPos, startNode, prevNode);                    
            if(targetNodes.length){
                for(var i = 0; i < targetNodes.length; ++i){
                    var snap = new THREE.Mesh( circleStrokeGeometry, circleMaterial );                
                    snap.rotation.x = -Math.PI/2;
                    snap.position.x = targetNodes[i].x;
                    snap.position.y = targetNodes[i].y;
                    snap.position.z = targetNodes[i].z;                            
                    scene.add(snap);
                    targets.push(snap);
                }
            }
        };
    }

    
        
    function move(event, x, y) {       
                
        if(lastMousePos){            
            mousePos = new THREE.Vector2(x, y);
        }
        mouse.x = ( x / window.innerWidth ) * 2 - 1;
        mouse.y = - ( y / window.innerHeight ) * 2 + 1;

        var pos = get3dPointZAxis(plane);
        var low = new THREE.Vector3(Math.floor(pos.x), 0, Math.floor(pos.z));
        var high = new THREE.Vector3(Math.ceil(pos.x), 0, Math.ceil(pos.z));            

        var baryX = 1.0 - (high.x - pos.x);
        var baryZ = 1.0 - (high.z - pos.z);        

        // dot
        if(actionState == actionStates.DOT){            
            snapPos = new THREE.Vector3();        
            snapPos.x = baryX > 0.5 ? high.x : low.x;
            snapPos.z = baryZ > 0.5 ? high.z : low.z;
                       
            if(!mouseDown){
                if(!circle){
                    circle = new THREE.Mesh( circleGeometry, circleMaterial );                
                    circle.rotation.x = -Math.PI/2;
                    scene.add(circle);
                }                
                circle.position.x = snapPos.x;
                circle.position.z = snapPos.z;
            }            
            else{                
                var dot = dots.addDot(snapPos);
                if(dot){
                    scene.add(dot);   
                    scene.remove(circle);    
                    circle = null;         
                }
                snapPos = null;
            }            
        }
        else if(actionState == actionStates.DASH){       

            snapPos = new THREE.Vector3();        
            snapPos.x = baryX > 0.5 ? high.x : low.x;
            snapPos.z = baryZ > 0.5 ? high.z : low.z;

            if(!mouseDown){                                
                
                nearestNode = dots.nearestNode(snapPos, pos);
                if(nearestNode){                    
                    if(!circleStroke1){
                        circleStroke1 = new THREE.Mesh( circleStrokeGeometry, circleMaterial );                
                        circleStroke1.rotation.x = -Math.PI/2;
                        scene.add(circleStroke1);
                    }
                    circleStroke1.position.x = nearestNode.x;
                    circleStroke1.position.z = nearestNode.z;                                        
                }
                else{
                    scene.remove(circleStroke1);
                    circleStroke1 = null;
                }                
                
                if(dots.dotExists(snapPos)){               
                    if(!circleHighlight){
                        circleHighlight = new THREE.Mesh( circleGeometry, circleHighlightMaterial );                
                        circleHighlight.rotation.x = -Math.PI/2;
                        scene.add(circleHighlight);
                    }
                    circleHighlight.position.x = snapPos.x;
                    circleHighlight.position.z = snapPos.z;     
                }   
                else{                    
                    scene.remove(circleHighlight);
                    circleHighlight = null;
                }                 
            }            
            else{      
                // mouse down                      

                if(startNode){

                    if(targetNodes && targetNodes.length){
                        var minNode = null;
                        var minDistance = Infinity;
                        for(var i = 0; i < targetNodes.length; ++i){
                            var targetPos = targetNodes[i].position;       
                            var dist = targetPos.distanceTo(pos);
                            if(dist < minDistance){
                                minNode = targetNodes[i];
                                minDistance = dist;
                            }
                        }            
                        
                        if(stroke){
                            scene2.remove(stroke);
                            stroke = null;
                        }
                        stroke = dots.getStroke(snapPos, 
                                        startNode.position, startNode.type, startNode.direction,
                                        minNode.position, minNode.type, minNode.direction
                                    );                    
                        if(stroke)
                            scene2.add(stroke);
                    
                        if(minDistance < 0.1){                            
                            stroke.material = Dots.StrokeMaterial;
                            prevNode = startNode;
                            startNode = minNode;
                            stroke = null;
                            updateStartNode();
                        }
                        
                    }
                }
                
            }            
        }                
    }

    function up(event)
    {   
        if(!mouseDown)
            return;
        mouseDown = false;                
        controls.enabled = true;

        if(actionState == actionStates.DOT){
            if(snapPos){       
                var dot = dots.addDot(snapPos);
                if(dot){                                
                    scene.add(dot);                
                    scene.remove(circle);   
                    circle = null;          
                }
                snapPos = null;         
            }
        }    
        else if(actionState == actionStates.DASH){
            if(targets.length){
                targets.forEach(function(t){
                    scene.remove(t);
                });                        
            }
            targetNodes = null;
            startNode = prevNode = null;
        }                    
    }

    function onMouseWheel(event){                        
    }
    
    function onMouseIn( event ) {
        mouseOut = false;                 
    }

    function onMouseOut( event ) {
        mouseOut = true;                 
    }    

    ////////////////////////////////////////////////////////////////    

    function get3dPointZAxis(mesh)
    {
        raycaster.setFromCamera( mouse, camera );     
        var intersects = raycaster.intersectObject(mesh, true);
        if ( intersects.length > 0 ) {
            return intersects[0].point;
        } else {            
            return null;
        }            
    }    

    ////////////////////////////////////////////////////////////////

    // mouse events

    function onMouseDown(event){
        down(event, event.clientX, event.clientY);
    }

    function onMouseMove(event){
        move(event, event.clientX, event.clientY);
    }

    function onMouseUp(event){
        up(event, event.clientX, event.clientY);
    }

    // touch events
    var lastTouch;
    function onTouchStart(event){
        event.preventDefault();  
        lastTouch = {x: event.touches[0].pageX, y: event.touches[0].pageY};
        down(event, event.touches[0].pageX, event.touches[0].pageY);
    }
    
    function onTouchMove( event ) {
        event.preventDefault();  
        lastTouch = {x: event.touches[0].pageX, y: event.touches[0].pageY};        
    }    

    function onTouchEnd(event){
        event.preventDefault();  
        up(event, lastTouch.x, lastTouch.y);
    }    
            
    function onKeyDown(event){            
    }
    
    function onKeyUp(event){                
    }

    // set action state

    function setActionStateDot(){        
        setActionStateHelper(actionStates.DOT, false);                
    }
    
    function setActionStateDash(){        
        setActionStateHelper(actionStates.DASH, false);           
        dots.setupNodes();     
    }
        
    function setActionStateHelper(state){         
        scene.remove(circle); circle = null;        
        scene.remove(circleHighlight); circleHighlight = null;
        actionState = state;        
    }           
   
    
    function addEventListeners(){
        // mouse events
        window.addEventListener('mousedown', onMouseDown, false);
        window.addEventListener('mousemove', onMouseMove, false);
        window.addEventListener('mouseup', onMouseUp, false);
        window.addEventListener('mouseover', onMouseIn, false);
        window.addEventListener('mouseout', onMouseOut, false);        
        window.addEventListener('mousewheel', onMouseWheel, false);        

        // touch events
        window.addEventListener('touchstart', onTouchStart, {passive: false});
        window.addEventListener('touchmove', onTouchMove, {passive: false});
        window.addEventListener('touchend', onTouchEnd, {passive: false});

        // keyboard events
        window.addEventListener('keydown', onKeyDown, false);
        window.addEventListener('keyup', onKeyUp, false);                
    }

    function removeEventListeners(){
        // mouse events
        window.removeEventListener('mousedown', onMouseDown, false);
        window.removeEventListener('mousemove', onMouseMove, false);
        window.removeEventListener('mouseup', onMouseUp, false);
        window.removeEventListener('mouseover', onMouseIn, false);
        window.removeEventListener('mouseout', onMouseOut, false);        
        window.removeEventListener('mousewheel', onMouseWheel, false);        

        // touch events
        window.removeEventListener('touchstart', onTouchStart, {passive: false});
        window.removeEventListener('touchmove', onTouchMove, {passive: false});
        window.removeEventListener('touchend', onTouchEnd, {passive: false});

        // keyboard events
        window.removeEventListener('keydown', onKeyDown, false);
        window.removeEventListener('keyup', onKeyUp, false);                
    }

    // listen to the resize event
    window.addEventListener('resize', onResize, false);    
    addEventListeners();    
    