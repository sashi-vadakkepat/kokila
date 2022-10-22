/*
 * Dots.js
 * 
 * @author Sashi Vadakkepat - sashi@punchdialog.com
 * 
 */

var Dots = function(){
    this.dots = [];
    this.dotsKdTree = new kdTree([], Dots.distanceFn, ["x", "z"]);    
    //this.nodesKdTree = new kdTree([], Dots.distanceFn, ["x", "z"]);

    Dots.createArcGeometry();
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

const lineMaterial = new THREE.LineBasicMaterial( { color: 0xbbbbbb } );

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
    this.nodesKdTree = new kdTree([], Dots.distanceFn, ["x", "z"]);
    var nodesKdTree = this.nodesKdTree;        
    this.dots.forEach(function(dot){
        var pos = dot.position;
        nodesKdTree.insert(new SnapPt(pos.x + 0.25, 0, pos.z + 0.25, "mid", "se"));
        nodesKdTree.insert(new SnapPt(pos.x + 0.25, 0, pos.z - 0.25, "mid", "ne"));
        nodesKdTree.insert(new SnapPt(pos.x - 0.25, 0, pos.z - 0.25, "mid", "nw"));
        nodesKdTree.insert(new SnapPt(pos.x - 0.25, 0, pos.z + 0.25, "mid", "sw"));

        var east = new THREE.Vector3(pos.x + 1, 0, pos.z);
        if(dots.dotExists(east)){            
            east.x -= 0.5;
            var nearest = nodesKdTree.nearest(east, 1, 1);
            if(nearest && nearest[0][1] != 0){                
                nodesKdTree.insert(new SnapPt(east.x, east.y, east.z, "jct"));                
            }
        }

        var north = new THREE.Vector3(pos.x, 0, pos.z - 1);
        if(dots.dotExists(north)){            
            north.z += 0.5;
            var nearest = nodesKdTree.nearest(north, 1, 1);
            if(nearest && nearest[0][1] != 0){                
                nodesKdTree.insert(new SnapPt(north.x, north.y, north.z, "jct"));                
            }
        }

        var west = new THREE.Vector3(pos.x - 1, 0, pos.z);
        if(dots.dotExists(west)){
            west.x += 0.5;            
            var nearest = nodesKdTree.nearest(west, 1, 1);
            if(nearest && nearest[0][1] != 0){                
                nodesKdTree.insert(new SnapPt(west.x, west.y, west.z, "jct"));                
            }
        }

        var south = new THREE.Vector3(pos.x, 0, pos.z + 1);
        if(dots.dotExists(south)){            
            south.z -= 0.5;
            var nearest = nodesKdTree.nearest(south, 1, 1);
            if(nearest && nearest[0][1] != 0){                
                nodesKdTree.insert(new SnapPt(south.x, south.y, south.z, "jct"));                
            }
        }
    });
}

Dots.Radius = Math.sqrt(0.25 * 0.25 + 0.25 * 0.25);
Dots.ArcRes = 25;

Dots.createArcGeometry = function(){
    Dots.gEast = new THREE.BufferGeometry().setFromPoints(
        new THREE.Path().absarc(0, 0, Dots.Radius, -Math.PI/4, Math.PI/4).getSpacedPoints(Dots.ArcRes)
    );
    Dots.gSouth = new THREE.BufferGeometry().setFromPoints(
        new THREE.Path().absarc(0, 0, Dots.Radius, Math.PI/4, 3 * Math.PI/4).getSpacedPoints(Dots.ArcRes)
    );
    Dots.gWest = new THREE.BufferGeometry().setFromPoints(
        new THREE.Path().absarc(0, 0, Dots.Radius, 3*Math.PI/4, 5*Math.PI/4).getSpacedPoints(Dots.ArcRes)
    );
    Dots.gNorth = new THREE.BufferGeometry().setFromPoints(
        new THREE.Path().absarc(0, 0, Dots.Radius, 5* Math.PI/4, -Math.PI/4).getSpacedPoints(Dots.ArcRes)
    );    
}

Dots.StrokeMaterial = new THREE.LineBasicMaterial({color: "black"});

Dots.prototype.getStroke = function(pos, pos1, type1, dir1, pos2, type2, dir2){
    if(type1 == "jct" || type2 == "jct"){
        const linePts = [ pos1, pos2 ];
        const lineGeometry = new THREE.BufferGeometry().setFromPoints(linePts);
        var line = new THREE.Line(lineGeometry, Dots.StrokeMaterial);                            
        return line;
    }
    else{
        var arc = null;        
        if(dir1 == "se"){
            if(dir2 == "ne"){
                // east
                arc = new THREE.Line(Dots.gEast, Dots.StrokeMaterial);
            }
            else if(dir2 == "sw"){
                // south
                arc = new THREE.Line(Dots.gSouth, Dots.StrokeMaterial);
            }
        }
        else if(dir1 == "ne"){
            if(dir2 == "se"){
                // east
                arc = new THREE.Line(Dots.gEast, Dots.StrokeMaterial);
            }
            else if(dir2 == "nw"){
                // north
                arc = new THREE.Line(Dots.gNorth, Dots.StrokeMaterial);
            }
        }
        else if(dir1 == "nw"){
            if(dir2 == "ne"){
                // north
                arc = new THREE.Line(Dots.gNorth, Dots.StrokeMaterial);
            }
            else if(dir2 == "sw"){
                // west
                arc = new THREE.Line(Dots.gWest, Dots.StrokeMaterial);
            }
        }
        else if(dir1 == "sw"){
            if(dir2 == "nw"){
                // west
                arc = new THREE.Line(Dots.gWest, Dots.StrokeMaterial);
            }
            else if(dir2 == "se"){
                // south
                arc = new THREE.Line(Dots.gSouth, Dots.StrokeMaterial);
            }
        }

        if(arc){
            arc.position.x = pos.x;
            arc.position.y = pos.y;
            arc.position.z = pos.z;

            arc.rotation.x = Math.PI/2;        
        }
        return arc;
    }    
}

Dots.prototype.getNext = function(prev, curr){
    var next = [];
    
}

Dots.prototype.getNextCandidateNodes = function(dotPos, node){    
    var candidates = [];   
    if(node.type == 'mid'){
        var se = new THREE.Vector3(dotPos.x + 0.25, 0, dotPos.z + 0.25);
        var ne = new THREE.Vector3(dotPos.x + 0.25, 0, dotPos.z - 0.25);
        var nw = new THREE.Vector3(dotPos.x - 0.25, 0, dotPos.z - 0.25);
        var sw = new THREE.Vector3(dotPos.x - 0.25, 0, dotPos.z + 0.25);

        var e = new THREE.Vector3(dotPos.x + 0.5, 0, dotPos.z);
        var n = new THREE.Vector3(dotPos.x, 0, dotPos.z - 0.5);
        var w = new THREE.Vector3(dotPos.x - 0.5, 0, dotPos.z);
        var s = new THREE.Vector3(dotPos.x, 0, dotPos.z + 0.5);

        
        switch(node.direction){
            case 'se':
                candidates.push(ne);
                candidates.push(sw);
                candidates.push(s);
                candidates.push(e);
                break;
            case 'ne':
                candidates.push(nw);
                candidates.push(se);
                candidates.push(n);
                candidates.push(e);
                break;
            case 'nw':
                candidates.push(sw);
                candidates.push(ne);
                candidates.push(n);
                candidates.push(w);
                break;
            case 'sw':
                candidates.push(nw);
                candidates.push(se);
                candidates.push(s);
                candidates.push(w);
                break;
        }     
    }
    else if(node.type == 'jct'){        
        candidates.push(new THREE.Vector3(node.x + 0.25, 0, node.z + 0.25));
        candidates.push(new THREE.Vector3(node.x + 0.25, 0, node.z - 0.25));
        candidates.push(new THREE.Vector3(node.x - 0.25, 0, node.z - 0.25));
        candidates.push(new THREE.Vector3(node.x - 0.25, 0, node.z + 0.25));
        
    }

    var candidateNodes = [];
    for(var i = 0; i < candidates.length; ++i){
        var nearest = this.nodesKdTree.nearest(candidates[i], 1, 0) ;
        if(nearest && nearest[0][1] == 0)
            candidateNodes.push(nearest);
    }        
    

    return candidateNodes;
}