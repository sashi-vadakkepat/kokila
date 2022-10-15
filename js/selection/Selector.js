/*
 * Selector.js
 * 
 * @author Sashi Vadakkepat - sashi@punchdialog.com
 * 
 */

var Selector = function(selectionSet){
    this.raycaster = new THREE.Raycaster();
    this.raycaster.params.Line.threshold = 0.01;
    this.selectionMaterial = new THREE.MeshStandardMaterial({color: 0xff6060, transparent: true, opacity: 0.75, side:THREE.DoubleSide});
    this.selectionMaterial.color.convertSRGBToLinear();

    this.selectionMaterial.polygonOffset = true;
    this.selectionMaterial.polygonOffsetFactor = -0.1;

    this.selectionSet = selectionSet;
    this.multiSelect = false;
    this.selection = [];
    this.lastSelection = null;
    
    this.backupMaterials = new Array();
    this.backupIndex = 0;

    this.firstPrimitiveType = null;
    this.hasDifferentPrimitives = false;
};

Selector.prototype.setMultiSelect = function(flag){
    this.multiSelect = flag;
}

Selector.prototype.setSelection = function(sceneObject){    
    if(this.multiSelect){
        if(this.alreadyInSelection(sceneObject))
            return;
    }
    else{
        this.clearSelection();
    }        
            
    this.addToSelection(sceneObject);
}

Selector.prototype.selectAll = function(sceneObjects){
    this.multiSelect = true;
    var selector = this;
    sceneObjects.forEach(function(s){
        if(s.visible)
            selector.setSelection(s);
    })
    this.multiSelect = false;
}

Selector.prototype.alreadyInSelection = function(sceneObject){
    return (this.selection.indexOf(sceneObject) != -1);
}

// add to selection - no check for multiselect flag
Selector.prototype.addToSelection = function(sceneObject){
    if(sceneObject.primitive.nonSelectable)
        return;
        
    if(this.alreadyInSelection(sceneObject))
        return;

    var backup = [];                
    this.setMaterial(sceneObject, this.selectionMaterial, backup);
    
    this.selection.push(sceneObject);    
    this.backupMaterials.push(backup);
    this.lastSelection = sceneObject;    

    if(!this.firstPrimitiveType){
        this.firstPrimitiveType = sceneObject.primitive.type;        
    }
    else if(!this.hasDifferentPrimitives){
        this.hasDifferentPrimitives = (sceneObject.primitive.type == this.firstPrimitiveType) ? false : true;        
    }    
}

Selector.prototype.addPrimitivesToSelection = function(primitives){
    var selector = this;
    primitives.forEach(function(p){
        selector.addToSelection(p.sceneObject);
    })
}

// remove from Selection - replaces last selected object 
// with the last object in selection
Selector.prototype.removeFromSelection = function(sceneObject){
    var index = this.selection.indexOf(sceneObject);
    if(index != -1){
        this.backupIndex = 0;
        this.resetMaterial(sceneObject, this.backupMaterials[index]);
        this.selection.splice(index, 1);
        this.backupMaterials.splice(index, 1);
        if(this.selection.length > 0)
            this.lastSelection = this.selection[this.selection.length -1];
        else    
            this.lastSelection = null;                                                                         
    }    
    this.firstPrimitiveType = null;
}

Selector.prototype.removePrimitivesFromSelection = function(primitives){
    var selector = this;
    primitives.forEach(function(p){
        selector.removeFromSelection(p.sceneObject);
    })
}

Selector.findObject = function(intersects){
    var found = false;
    var retVal = intersects[0].object;
    for(var i = 0; i < intersects.length && !found; ++i){
        if(intersects[i].object.selectionPrioritized){
            found = true;
            retVal = intersects[i].object;
        }
    }
    return retVal;
}

Selector.prototype.scanAndSelect = function(mousePt, camera){
    this.raycaster.setFromCamera( mousePt, camera );
    var intersects = this.raycaster.intersectObjects(this.selectionSet, true);
        
    if ( intersects.length > 0 ) {
        var sel = Selector.findObject(intersects);
        //var sel = intersects[0].object;        
        var objectParent = sel.parent;
        var sceneParent = objectParent.parent;             
        while(sceneParent != null){
            sel = objectParent;
            objectParent = sel.parent;
            sceneParent = objectParent.parent;
        }

        this.setSelection(sel);                                            
                                
    } else {            
        if(!this.multiSelect)
            this.clearSelection();
    }
    return this.selection;
};

Selector.prototype.clearSelection = function(){
    for(var i = 0; i < this.selection.length; ++i){
        this.backupIndex = 0;
        this.resetMaterial(this.selection[i], this.backupMaterials[i]);          
    }    
    this.backupMaterials = []; 
    this.selection = [];
    this.lastSelection = null;
    this.firstPrimitiveType = null;
    this.hasDifferentPrimitives = false;    
}

Selector.prototype.setMaterial = function(node, material, backup) {
    var selectionMaterial = null;
    if(node.selectionMaterial)
        selectionMaterial = node.selectionMaterial;
    if(node.material != null && node.selectionChangesMaterial == null){
        if(Array.isArray(node.material)){
            for(var i = 0; i < node.material.length; ++i){
                backup.push(node.material[i]);            
                if(selectionMaterial){
                    node.material[i] = node.selectionMaterial;
                }
                else{
                    node.material[i] = material;                              
                }        
            }
        }
        else{
            backup.push(node.material); 
            if(selectionMaterial){
                node.material = node.selectionMaterial;
            }
            else{
                node.material = material;                              
            }        
        }        
    }
        
    if (node.children) {
        for (var i = 0; i < node.children.length; i++) {
            this.setMaterial(node.children[i], material, backup);
        }
    }
}; 

Selector.prototype.resetMaterial = function(node, backup) {
    if(node.material != null && node.selectionChangesMaterial == null){
        if(Array.isArray(node.material)){
            for(var i = 0; i < node.material.length; ++i){
                node.material[i] = backup[this.backupIndex++];                              
            }
        }
        else{
            node.material = backup[this.backupIndex++];                              
        }        
    }
        
    if (node.children) {
        for (var i = 0; i < node.children.length; i++) {
            this.resetMaterial(node.children[i], backup);
        }
    }
};

// scan for any objects under the mousePt - does not
// change the internal state of the selector
Selector.prototype.scan = function(mousePt, camera){
    this.raycaster.setFromCamera( mousePt, camera );
    var intersects = this.raycaster.intersectObjects(this.selectionSet, true);
        
    var sel = null;
    if ( intersects.length > 0 ) {
        sel = Selector.findObject(intersects);
        //sel = intersects[0].object;
        var objectParent = sel.parent;
        var sceneParent = objectParent.parent;             
        while(sceneParent != null){
            sel = objectParent;
            objectParent = sel.parent;
            sceneParent = objectParent.parent;
        }                                                                                    
    }
    return sel;
};

Selector.prototype.areaSelect = function(sketchLines){
    var points = [];
    for(var i = 0; i < sketchLines.length; ++i){
        points.push(sketchLines[i].geometry.vertices[0]);
    }
    points.push(sketchLines[sketchLines.length - 1].geometry.vertices[1]); 
    points = PolylineFilter.filter(points);
    areaSelected = [];
    var primitives = model.getPrimitives();
    this.selectionSet.forEach(function(s){
        var p = s.primitive;
        if(p.sceneObject.visible && pointInPolygon(Model.getCenter(p), points)){
            areaSelected.push(s);
        }
    });                        
    return areaSelected;          
}

// helper method that runs a DDA algorithm to find
// the pixels to be "turned on" between 2 points
Selector.prototype.DDA = function(x1, y1, x2, y2){
    var pixels = [];
    var dx = x2-x1; dy = y2-y1;
    var steps;
    if(Math.abs(dx) > Math.abs(dy))
        steps = Math.abs(dx);
    else
        steps = Math.abs(dy);
    var xInc = dx/steps; var yInc = dy/steps;
    var x = x1; var y = y1;
    pixels.push(new THREE.Vector2(Math.round(x), Math.round(y)));
    for(var i = 0; i < steps; ++i){
        x += xInc;
        y += yInc;    
        pixels.push(new THREE.Vector2(Math.round(x), Math.round(y)));
    }

    return pixels;
}

Selector.prototype.simpleScan = function(mousePt, camera, w, h){
    var scanPt = new THREE.Vector2((mousePt.x/w) * 2 - 1, -(mousePt.y/h) * 2 + 1);
    var sel =  this.scan(scanPt,camera);
    return {selected: sel, scanPt: scanPt};
}

/*
// unused methods

Selector.prototype.spiralScan = function(mousePt, radius, camera, w, h){       
    var go = [
        east = function (pt){
            pt.x = pt.x + 1;            
        },
        north = function(pt){            
            pt.y = pt.y - 1;

        },
        west = function(pt){            
            pt.x = pt.x -1;;            
        },
        south = function(pt){            
            pt.y = pt.y + 1;
        }
    ];     

    var convert = function(pt,sPt){        
        sPt.x = (pt.x/w) * 2 - 1;
        sPt.y = -(pt.y/h) * 2 + 1;
    }

    var pt = mousePt.clone();
    var scanPt = new THREE.Vector2();
    convert(pt, scanPt);
    var sel =  this.scan(scanPt,camera);
    

    var dir = 0;
    for (var i = 1; i<= radius && !sel; ++i){
        for (var j = 0; j < i && !sel; ++j){
            go[dir](pt);      
            convert(pt,scanPt);   
            sel = this.scan(scanPt, camera);                        
        }
        dir = (dir+1)%go.length;
        for (var j = 0; j < i && !sel; ++j){
            go[dir](pt); 
            convert(pt,scanPt);   
            sel = this.scan(scanPt, camera);            
        }
        dir = (dir+1)%go.length;
    }        
    return {selected: sel, scanPt: scanPt};
}

Selector.prototype.blockScan = function(mousePt, radius, camera, w, h){       

    var convert = function(x, y, sPt){
        sPt.x = (x/w) * 2 - 1;
        sPt.y = -(y/h) * 2 + 1;        
    }

    var scanPt = new THREE.Vector2();
    convert(mousePt.x, mousePt.y, scanPt);
    var sel = this.scan(scanPt, camera);

    if(!sel){
        var r = Math.floor(radius/2);
        var x = mousePt.x - r;
        var y = mousePt.y + r;
        for(var i = x; i <= mousePt.x+r && !sel; ++i){
            for(var j = y; j >= mousePt.y-r && !sel; --j){
                convert(i, j, scanPt);
                sel = this.scan(scanPt, camera); 
            }
        }
    }
    return {selected: sel, scanPt: scanPt};
}
 
Selector.prototype.scanSegment = function(mouseSegment, camera){
    var sel = null;
    for(var i = 0; i < mouseSegment.length && sel == null; ++i){
        sel = this.scan(mouseSegment[i], camera)
    }
    this.clearSelection();
    if(sel){
        this.selection = sel;
        this.setMaterial(this.selection, this.selectionMaterial);
    }
    
    return this.selection;
}
*/

