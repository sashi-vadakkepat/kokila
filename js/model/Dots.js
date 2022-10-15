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
        dot.position.x = pos.x;
        dot.position.z = pos.z;
        dot.rotation.x = -Math.PI/2;
        this.dots.push(dot);        
        return dot;
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