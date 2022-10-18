/*
 * Dots.js
 * 
 * @author Sashi Vadakkepat - sashi@punchdialog.com
 * 
 */

var Dots = function(){
    this.dots = [];
    this.dotsKdTree = new kdTree([], Dots.distanceFn, ["x", "z"]);    
    this.nodesKdTree = new kdTree([], Dots.distanceFn, ["pos.x", "pos.z"]);
}

Dots.dotGeometry = new THREE.CircleGeometry( 0.08, 32 );
Dots.dotMaterial = new THREE.MeshBasicMaterial( { color: 0x000000 } );

const line1Pts = [
    new THREE.Vector3(0.5, 0, 0),
    new THREE.Vector3(0, 0, -0.5 )
];
const line1Geometry = new THREE.BufferGeometry().setFromPoints(line1Pts);

const line2Pts = [
    new THREE.Vector3(0, 0, -0.5),
    new THREE.Vector3(-0.5, 0, 0 )
];
const line2Geometry = new THREE.BufferGeometry().setFromPoints(line2Pts);

const line3Pts = [            
    new THREE.Vector3(-0.5, 0, 0 ),
    new THREE.Vector3(0, 0, 0.5)
];
const line3Geometry = new THREE.BufferGeometry().setFromPoints(line3Pts);

const line4Pts = [            
    new THREE.Vector3(0, 0, 0.5),
    new THREE.Vector3(0.5, 0, 0 )            
];
const line4Geometry = new THREE.BufferGeometry().setFromPoints(line4Pts);

const lineMaterial = new THREE.LineBasicMaterial( { color: 0x333333 } );

Dots.distanceFn = function(a, b){
    var dx = a.x - b.x;
    var dz = a.z - b.z;
    return Math.sqrt(dx*dx + dz*dz);
}

Dots.prototype.addDot = function(pos){
    var nearest = this.dotsKdTree.nearest(pos, 1, 1);
    if(!nearest.length || nearest[0][1] != 0){
        this.dotsKdTree.insert(pos);

        var dot = new THREE.Mesh( Dots.dotGeometry, Dots.dotMaterial );                
        dot.position.x = pos.x;
        dot.position.z = pos.z;
        dot.rotation.x = -Math.PI/2;
        this.dots.push(dot);        
        
        var line1 = new THREE.Line(line1Geometry, lineMaterial);                            
        line1.position.x = pos.x;
        line1.position.z = pos.z;
        var line2 = new THREE.Line(line2Geometry, lineMaterial);                            
        line2.position.x = pos.x;
        line2.position.z = pos.z;
        var line3 = new THREE.Line(line3Geometry, lineMaterial);                            
        line3.position.x = pos.x;
        line3.position.z = pos.z;
        var line4 = new THREE.Line(line4Geometry, lineMaterial);                            
        line4.position.x = pos.x;
        line4.position.z = pos.z;

        var cell = new THREE.Object3D();
        cell.add(line1);
        cell.add(line2);
        cell.add(line3);
        cell.add(line4);        

        cell.add(dot);

        return cell;
    }
    else{
        return null;
    }
}

Dots.prototype.dotExists = function(pos){
    var nearest = this.dotsKdTree.nearest(pos, 1, 1);
    if(nearest.length && nearest[0][1] == 0){
        return true;
    }
    return false;
}

Dots.prototype.nearestNode = function(snapPos, pos){
    if(this.dotExists(snapPos)){
        var nearest = this.nodesKdTree.nearest(pos, 1, 1);
        if(nearest)
            return nearest[0][0];
    }
    return null;
}

Dots.prototype.nearestNodePair = function(snapPos, pos){
    if(this.dotExists(snapPos)){
        var nearest = this.nodesKdTree.nearest(pos, 2, 1);
        if(nearest)
            return [nearest[0][0], nearest[1][0]];
    }
    return null;
}

Dots.prototype.setupNodes = function(){
    var dots = this;
    var nodesKdTree = this.nodesKdTree;        
    this.dots.forEach(function(dot){
        var pos = dot.position;
        nodesKdTree.insert(new THREE.Vector3(pos.x + 0.25, 0, pos.z + 0.25));
        nodesKdTree.insert(new THREE.Vector3(pos.x + 0.25, 0, pos.z - 0.25));
        nodesKdTree.insert(new THREE.Vector3(pos.x - 0.25, 0, pos.z - 0.25));
        nodesKdTree.insert(new THREE.Vector3(pos.x - 0.25, 0, pos.z + 0.25));

        var east = new THREE.Vector3(pos.x + 1, 0, pos.z);
        if(dots.dotExists(east)){            
            var nearest = nodesKdTree.nearest(east, 1, 1);
            if(nearest && nearest[0][1] != 0){
                east.x -= 0.5;
                nodesKdTree.insert(east);
            }
        }

        var north = new THREE.Vector3(pos.x, 0, pos.z - 1);
        if(dots.dotExists(north)){            
            var nearest = nodesKdTree.nearest(north, 1, 1);
            if(nearest && nearest[0][1] != 0){
                north.z += 0.5;
                nodesKdTree.insert(north);
            }
        }

        var west = new THREE.Vector3(pos.x - 1, 0, pos.z);
        if(dots.dotExists(west)){
            var nearest = nodesKdTree.nearest(west, 1, 1);
            if(nearest && nearest[0][1] != 0){
                west.x += 0.5;            
                nodesKdTree.insert(west);                
            }
        }

        var south = new THREE.Vector3(pos.x, 0, pos.z + 1);
        if(dots.dotExists(south)){            
            var nearest = nodesKdTree.nearest(south, 1, 1);
            if(nearest && nearest[0][1] != 0){
                south.z -= 0.5;
                nodesKdTree.insert(south);                
            }
        }
    });
}