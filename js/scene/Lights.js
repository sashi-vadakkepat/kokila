/*
 * Lights.js
 * 
 * @author Sashi Vadakkepat - sashi@punchdialog.com
 * 
 */


var Lights = function(box, scene){
    this.scene = scene;
    this.shadowMapSize = 1024 * 8;        
    this.preset = Lights.Presets.DEFAULT;
    this.setLightingParameters();    
    this.setup(box);    
}

Lights.Presets = {
    DEFAULT: 0, 
    SUMMER_DAY: 1, 
    SOFT_LIGHT: 2, 
    HIGHTLIGHT: 3
};

Lights.prototype.reset = function(){
    this.preset = Lights.Presets.DEFAULT;
    this.setLightingParameters();
}

Lights.prototype.setPreset = function(preset){
    this.preset = preset;
    this.setLightingParameters();
}

Lights.prototype.setLightingParameters = function(){

    if(this.preset == Lights.Presets.DEFAULT){
        this.ambientIntensity = 0.155;
        this.hemisphereIntensity = 0.5;
        this.leftIntensity = 0.185;
        this.rightIntensity = 0.175;
        this.backIntensity = 0.175;
        this.frontIntensity = 0.185;        
        this.bottomIntensity = 0.2;
        this.topIntensity = 0.1;
        this.shadowIntensity = 0.285;
    }
    else if(this.preset == Lights.Presets.SUMMER_DAY){
        this.ambientIntensity = 0;
        this.hemisphereIntensity = 1;
        this.leftIntensity = 0;
        this.rightIntensity = 1;
        this.backIntensity = 1;
        this.frontIntensity = 0;        
        this.bottomIntensity = 0;
        this.topIntensity = 0.85;
        this.shadowIntensity = 1;
    }
    else if(this.preset == Lights.Presets.SOFT_LIGHT){
        this.ambientIntensity = 0;
        this.hemisphereIntensity = 0.9;
        this.leftIntensity = 0.6;
        this.rightIntensity = 0.6;
        this.backIntensity = 0.6;
        this.frontIntensity = 0.6;        
        this.bottomIntensity = 0;
        this.topIntensity = 0.3;
        this.shadowIntensity = 0.0;
    }
    else if(this.preset == Lights.Presets.HIGHTLIGHT){
        this.ambientIntensity = 0.7;
        this.hemisphereIntensity = 0;
        this.leftIntensity = 0.8;
        this.rightIntensity = 0.8;
        this.backIntensity = 0.8;
        this.frontIntensity = 0.8;        
        this.bottomIntensity = 0.12;
        this.topIntensity = 0.1;
        this.shadowIntensity = 0.8;
    }
}

Lights.prototype.setup = function(box){
    
    this.clear();    
    this.box = box.clone();            
    var center = new THREE.Vector3();
    this.box.getCenter(center);    
    this.target = makeHandle(center);    
    
    this.setupAmbientLight();    
    this.setupDirectionalLights(box);    
    this.setupHemisphereLight();
    this.setupShadowLight(box);    

    // helpers
    //this.setupHelpers();    
    //this.addHelpersToScene(scene);
}

Lights.prototype.setupAmbientLight = function(){
    this.ambientLight = new THREE.AmbientLight(0xffffff, this.ambientIntensity);
    this.scene.add(this.ambientLight);
}

Lights.prototype.setupDirectionalLights = function(box){
    var size = this.box.getSize(new THREE.Vector3());
    var max = Math.max(size.x, size.y, size.z);    
    var c = this.target.position.clone(); var f = 0.6;
    var sidelightElevation = 0.25;
    
    this.leftLight = this.setupDirectionalLight(new THREE.Vector3(c.x - f * max, c.y + sidelightElevation, c.z), this.target, 0xffffff, this.leftIntensity);
    this.rightLight = this.setupDirectionalLight(new THREE.Vector3(c.x + f * max, c.y + sidelightElevation, c.z), this.target, 0xffffff, this.rightIntensity);
    this.backLight = this.setupDirectionalLight(new THREE.Vector3(c.x, c.y + sidelightElevation, c.z - f * max), this.target, 0xffffff, this.frontIntensity);
    this.frontLight = this.setupDirectionalLight(new THREE.Vector3(c.x, c.y + sidelightElevation, c.z + f * max), this.target, 0xffffff, this.backIntensity);
    this.bottomLight = this.setupDirectionalLight(new THREE.Vector3(c.x, c.y - 0.1, c.z), this.target, 0xffffff, this.bottomIntensity);
    this.topLight = this.setupDirectionalLight(new THREE.Vector3(c.x, c.y + 0.1, c.z), this.target, 0xffffff, this.topIntensity);        

    this.scene.add(this.frontLight);
    this.scene.add(this.backLight);
    this.scene.add(this.leftLight);
    this.scene.add(this.rightLight);
    this.scene.add(this.bottomLight);
    this.scene.add(this.topLight);
}

Lights.prototype.setupHemisphereLight = function(){      
    var skyColor = 0x7c849b;//0xD0D3D4;
    var groundColor = 0xd7cbb1;//0xD6DBDF;
    this.hemisphereLight = new THREE.HemisphereLight(skyColor, groundColor, this.hemisphereIntensity);        
    this.scene.add(this.hemisphereLight);        
}

Lights.prototype.setupShadowLight = function(box){

    var shadowLength = 0.75; // value between 0 and 1
    var pos = this.computeShadowLightPosition(box, shadowLength, this.target.position);
    
    this.shadowLight = this.setupDirectionalLight(pos, this.target, 0xffffff, this.shadowIntensity);
    this.shadowLight.castShadow = true;   
    this.shadowLight.shadow.bias = -0.001;

    var planeNormal = this.target.position.clone().sub(pos).normalize();
    var plane = new THREE.Plane(planeNormal); 
    var dist = plane.distanceToPoint(this.shadowLight.position);

    this.shadowLightPlane = new THREE.Plane(planeNormal, -dist);    
    var coplanarPt = this.shadowLightPlane.coplanarPoint(new THREE.Vector3());    

    var center = this.box.getCenter(new THREE.Vector3());
    var size = this.box.getSize(new THREE.Vector3());

    var min = Infinity;
    var max = -Infinity;
    var radius = -Infinity;    

    //////// 1

    var bbPts = [];
    bbPts.push(new THREE.Vector3(center.x - size.x/2, center.y - size.y/2, center.z - size.z/2));
    bbPts.push(new THREE.Vector3(center.x + size.x/2, center.y - size.y/2, center.z - size.z/2));
    bbPts.push(new THREE.Vector3(center.x + size.x/2, center.y - size.y/2, center.z + size.z/2));
    bbPts.push(new THREE.Vector3(center.x - size.x/2, center.y - size.y/2, center.z + size.z/2));
    bbPts.push(new THREE.Vector3(center.x - size.x/2, center.y + size.y/2, center.z - size.z/2));    
    bbPts.push(new THREE.Vector3(center.x + size.x/2, center.y + size.y/2, center.z - size.z/2));    
    bbPts.push(new THREE.Vector3(center.x + size.x/2, center.y + size.y/2, center.z + size.z/2));
    bbPts.push(new THREE.Vector3(center.x - size.x/2, center.y + size.y/2, center.z + size.z/2));
    
    for(var i = 0; i < bbPts.length; ++i){
        var pp = this.shadowLightPlane.projectPoint(bbPts[i], new THREE.Vector3()); 
        var d = bbPts[i].distanceTo(pp);
        if(d < min)
            min = d;                
        if(d > max)
            max = d;        
        var r = this.shadowLight.position.distanceTo(pp);
        if(r >radius)
            radius = r;
    }
                    
    this.shadowLight.shadow.camera.near = min;
    this.shadowLight.shadow.camera.far = max;
    this.shadowLight.shadow.camera.left = -radius;
    this.shadowLight.shadow.camera.right = radius;
    this.shadowLight.shadow.camera.top = radius;
    this.shadowLight.shadow.camera.bottom = -radius;       
    
    this.shadowLight.shadow.mapSize.width = this.shadowMapSize;
    this.shadowLight.shadow.mapSize.height = this.shadowMapSize;

    this.scene.add(this.shadowLight);    
}

Lights.prototype.clear = function(){            
    this.scene.remove(this.ambientLight);    
    this.scene.remove(this.leftLight);    
    this.scene.remove(this.rightLight);        
    this.scene.remove(this.frontLight);        
    this.scene.remove(this.backLight);        
    this.scene.remove(this.bottomLight);        
    this.scene.remove(this.topLight);            
    this.scene.remove(this.hemisphereLight);
    this.scene.remove(this.shadowLight);      
    
}

// helper methods

Lights.prototype.setupDirectionalLight = function(position, target, color, intensity){
    var directionalLight = new THREE.DirectionalLight(color, intensity);
    directionalLight.position.set(position.x, position.y, position.z);
    if(target)
    directionalLight.target = target;            
    return directionalLight;
}

Lights.prototype.computeShadowLightPosition = function(box, shadowLength, targetPos){    
    var dir = new THREE.Vector3(-shadowLength, 1, shadowLength).normalize(); 
    var factor = 2;
    var size = box.getSize(new THREE.Vector3());
    var max = Math.max(size.x, size.y, size.z);
    dir.multiplyScalar(factor * max);
    var pos = targetPos.clone().add(dir);
    return pos;
}

Lights.prototype.update = function(params){
    if(params){
        if(params.ambientIntensity) this.ambientIntensity = params.ambientIntensity;
        if(params.hemisphereIntensity) this.hemisphereIntensity = params.hemisphereIntensity;        
        if(params.leftIntensity) this.leftIntensity = params.leftIntensity;        
        if(params.rightIntensity) this.rightIntensity = params.rightIntensity;        
        if(params.backIntensity) this.backIntensity = params.backIntensity;        
        if(params.frontIntensity) this.frontIntensity = params.frontIntensity;        
        if(params.bottomIntensity) this.bottomIntensity = params.bottomIntensity;        
        if(params.topIntensity) this.topIntensity = params.topIntensity;        
        if(params.shadowIntensity) this.shadowIntensity = params.shadowIntensity;      
        if(params.lightingPreset) this.preset = params.lightingPreset;  
    }

    this.ambientLight.intensity = this.ambientIntensity;
    this.hemisphereLight.intensity = this.hemisphereIntensity;    
    this.leftLight.intensity = this.leftIntensity;
    this.rightLight.intensity = this.rightIntensity;
    this.frontLight.intensity = this.frontIntensity;
    this.backLight.intensity = this.backIntensity;
    this.bottomLight.intensity = this.bottomIntensity;
    this.topLight.intensity = this.topIntensity;
    this.shadowLight.intensity = this.shadowIntensity;    
}

function makeHandle(vec3){
    var handle = new THREE.Object3D();
    handle.position.add(vec3);
    return handle;    
}

