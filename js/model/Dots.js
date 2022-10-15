/*
 * Dots.js
 * 
 * @author Sashi Vadakkepat - sashi@punchdialog.com
 * 
 */

var Dots = function(){
    this.kdTree = new kdTree([], Dots.distanceFn, ["x", "z"]);
    this.dots = [];
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
    var nearest = this.kdTree.nearest(pos, 1, 1);
    if(!nearest.length || nearest[0][1] != 0){
        this.kdTree.insert(pos);

        var dot = new THREE.Mesh( Dots.dotGeometry, Dots.dotMaterial );                
        //dot.position.x = pos.x;
        //dot.position.z = pos.z;
        dot.rotation.x = -Math.PI/2;
        this.dots.push(dot);        
        
        var line1 = new THREE.Line(line1Geometry, lineMaterial);                            
        var line2 = new THREE.Line(line2Geometry, lineMaterial);                            
        var line3 = new THREE.Line(line3Geometry, lineMaterial);                            
        var line4 = new THREE.Line(line4Geometry, lineMaterial);                            

        var cell = new THREE.Object3D();
        cell.add(line1);
        cell.add(line2);
        cell.add(line3);
        cell.add(line4);

        cell.position.x = pos.x;
        cell.position.z = pos.z;

        cell.add(dot);

        return cell;
    }
    else{
        return null;
    }
}

Dots.prototype.dotExists = function(pos){
    var nearest = this.kdTree.nearest(pos, 1, 1);
    if(nearest.length && nearest[0][1] == 0){
        return true;
    }
    return false;
}