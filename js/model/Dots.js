/*
 * Dots.js
 * 
 * @author Sashi Vadakkepat - sashi@punchdialog.com
 * 
 */

var Dots = function(){
    this.dots = [];
    this.dotsKdTree = new kdTree([], Dots.distanceFn, ["x", "z"]);    
    this.nodesKdTree = new kdTree([], Dots.distanceFn, ["x", "z"]);

    Dots.createArcGeometry();
    Dots.createMatLine();
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

        this.addNode(dot.position);

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

Dots.prototype.nearestNode = function(dotPos, pos){
    if(this.dotExists(dotPos)){
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

Dots.prototype.addNode = function(pos){
    var nodesKdTree = this.nodesKdTree;        
    
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
}

/*
Dots.prototype.setupNodes = function(){
    var dots = this;
    this.nodesKdTree = new kdTree([], Dots.distanceFn, ["x", "z"]);    
    this.dots.forEach(function(dot){
        dots.addNode(dot.position);        
    });
}
*/

Dots.Radius = Math.sqrt(0.25 * 0.25 + 0.25 * 0.25);
Dots.ArcRes = 1000;

Dots.createArcGeometry = function(){
    Dots.gEast = new THREE.BufferGeometry().setFromPoints(
        new THREE.Path().absarc(0, 0, Dots.Radius, 7 * Math.PI/4, Math.PI/4).getSpacedPoints(Dots.ArcRes)
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

Dots.matLine = null;
Dots.createMatLine = function(){
    Dots.matLine = new LineMaterial( {
        color: 0x000000,
        linewidth: .025, // in world units with size attenuation, pixels otherwise
        vertexColors: false,
        worldUnits: true,    
        //resolution:  // to be set by renderer, eventually
        dashed: false,
        //alphaToCoverage: true,    
    } );
}

Dots.createStrokeFromPts = function(pts){

    var strokeGeometry = new LineGeometry();
    strokeGeometry.setPositions(pts);
    var stroke = new Line2(strokeGeometry, Dots.matLine);
    stroke.computeLineDistances();
	stroke.scale.set( 1, 1, 1 );
    return stroke;  
}

Dots.createArcStartEnd = function(start, end){        
    var pos2D = new THREE.Path().absarc(0, 0, Dots.Radius, start, end).getSpacedPoints(Dots.ArcRes);
    var pos3D = [];        
    for(var i = 0; i < pos2D.length; ++i){        
        pos3D.push(pos2D[i].x, 0, pos2D[i].y);
    }        
    var arc = Dots.createStrokeFromPts(pos3D);        
    /*
    var arcGeometry = new THREE.BufferGeometry().setFromPoints(
        new THREE.Path().absarc(0, 0, Dots.Radius, start, end).getSpacedPoints(Dots.ArcRes)
    );  
    var arc = new THREE.Line(arcGeometry, Dots.StrokePreviewMaterial);
    */
    return arc;  
}


Dots.createLineStartEnd = function(start, end){    
    var linePts = [ start.x, start.y, start.z, end.x, end.y, end.z ];
    var line =  Dots.createStrokeFromPts(linePts);
    return line;    
}


Dots.getAngle = function(dotPos, pos){
    var base = new THREE.Vector3(1, 0, 0);
    var vec = new THREE.Vector3().subVectors(pos, dotPos).normalize();
    //var angle = base.angleTo(vec) * 180/Math.PI;

    var dot = base.x * vec.x + base.z * vec.z;
    var det = base.x * vec.z + base.z * vec.x;
    var angle = Math.atan2(det, dot);        
    return angle;
}


Dots.StrokePreviewMaterial = new THREE.LineBasicMaterial({color: 0xff0000});
Dots.StrokeMaterial = new THREE.LineBasicMaterial({color: 0x000000});

Dots.snapAngle = function(angle, target){
    var diff = Math.abs(target-angle);    
    var ret = { 
        angle:null,
        snapped: false
    }

    if(diff < 0.4){
        ret.angle = target;
        ret.snapped = true;        
    }
    else{
        ret.angle = angle;
        ret.snapped = false;        
    }
    return ret;
}

Dots.getQuadrant = function(angle){

    if(angle >= 0){
        if(angle <= Math.PI/4)
            return "e";
        else if (angle <= 3 * Math.PI/4)
            return "s";
        else 
            return "w";
    }
    else{
        if(angle >= -Math.PI/4)
            return "e";
        else if (angle >= -3 * Math.PI/4)
            return "n";
        else 
            return "w";
    }        
}

Dots.prototype.getStroke = function(dotPos, pos, pos1, type1, dir1, pos2, type2, dir2){

    var ret = {
        rep: null,
        snapped: false
    }
    if(type1 == "jct" || type2 == "jct"){

        var line = new THREE.Line3(pos1, pos2);
        var closestPt = new THREE.Vector3();
        line.closestPointToPoint(pos, true, closestPt);
        if(closestPt.distanceTo(pos2) == 0){
            closestPt = pos2;
            ret.snapped = true;
        }        
        
        ret.rep = Dots.createLineStartEnd(pos1, closestPt);
        return ret;
    }
    else{
        var arc = null;      
        var start = null;
        var end = null;
        var angle = Dots.getAngle(dotPos, pos);
        var quadrant =  Dots.getQuadrant(angle);

        if(dir1 == "se"){
            
            if(dir2 == "sw" && quadrant == "s"){
                // south                
                //arc = new THREE.Line(Dots.gSouth, Dots.StrokePreviewMaterial);
                start = Math.PI/4;
                var next = Dots.snapAngle(angle, 3 * Math.PI/4);
                end = next.angle;
                ret.snapped = next.snapped;                
            }
            else if(dir2 == "ne"  && quadrant == "e"){
                // east
                //arc = new THREE.Line(Dots.gEast, Dots.StrokePreviewMaterial);                  
                end = Math.PI/4;
                var next = Dots.snapAngle(angle, -Math.PI/4);
                start = next.angle;
                ret.snapped = next.snapped;                
            }            
        }
        else if(dir1 == "ne"){            
            if(dir2 == "se" && quadrant == "e"){
                // east
                //arc = new THREE.Line(Dots.gEast, Dots.StrokePreviewMaterial);
                start = -Math.PI/4;
                var next = Dots.snapAngle(angle, Math.PI/4);
                end = next.angle;
                ret.snapped = next.snapped;
            }
            else if(dir2 == "nw" && quadrant == "n"){
                // north
                //arc = new THREE.Line(Dots.gNorth, Dots.StrokePreviewMaterial);
                end = -Math.PI/4;
                var next = Dots.snapAngle(angle, -3 * Math.PI/4);
                start = next.angle;
                ret.snapped = next.snapped;
            }
        }
        else if(dir1 == "nw"){            
            if(dir2 == "ne" && quadrant == "n"){
                // north
                //arc = new THREE.Line(Dots.gNorth, Dots.StrokePreviewMaterial);
                start = -3 * Math.PI/4;
                var next = Dots.snapAngle(angle, -Math.PI/4);
                end = next.angle;
                ret.snapped = next.snapped;
            }
            else if(dir2 == "sw" && quadrant == "w"){
                // west
                //arc = new THREE.Line(Dots.gWest, Dots.StrokePreviewMaterial);
                end = -3 * Math.PI/4;
                var next = Dots.snapAngle(angle, 3 * Math.PI/4);
                start = next.angle;
                ret.snapped = next.snapped;
            }
        }
        else if(dir1 == "sw"){            
            if(dir2 == "nw" && quadrant == "w"){
                // west
                //arc = new THREE.Line(Dots.gWest, Dots.StrokePreviewMaterial);
                start = 3 * Math.PI/4;
                var next = Dots.snapAngle(angle, -3 * Math.PI/4);
                end = next.angle;
                ret.snapped = next.snapped;
            }
            else if(dir2 == "se" && quadrant == "s"){
                // south
                //arc = new THREE.Line(Dots.gSouth, Dots.StrokePreviewMaterial);                
                end = 3 * Math.PI/4;
                var next = Dots.snapAngle(angle, Math.PI/4);
                start = next.angle;
                ret.snapped = next.snapped;
            }
        }        

        if(start && end){
            var arc = Dots.createArcStartEnd(start, end);            

            if(arc){
                arc.position.x = dotPos.x;
                arc.position.y = dotPos.y;
                arc.position.z = dotPos.z;
                //arc.rotation.x = Math.PI/2;        
                ret.rep = arc;
            }
        }
        return ret;
    }    
}

Dots.prototype.getNextCandidateNodes = function(dotPos, node, prevNode){    
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

        if(!prevNode){
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
        else{
            if(prevNode.type == "mid"){
                // mid to mid
                switch(node.direction){
                    case 'se':
                        if(prevNode.direction == 'ne'){
                            candidates.push(sw);                        
                            candidates.push(s);                        
                        }
                        else if(prevNode.direction == 'sw'){
                            candidates.push(ne);                        
                            candidates.push(e);                        
                        }
                        break;
                    case 'ne':
                        if(prevNode.direction == 'se'){
                            candidates.push(nw);                        
                            candidates.push(n);                        
                        }
                        else if(prevNode.direction == 'nw'){
                            candidates.push(se);                        
                            candidates.push(e);                        
                        }
                        break;
                    case 'nw':
                        if(prevNode.direction == 'ne'){
                            candidates.push(sw);                        
                            candidates.push(w);                        
                        }
                        else if(prevNode.direction == 'sw'){
                            candidates.push(ne);                        
                            candidates.push(n);                        
                        }
                        break;
                    case 'sw':
                        if(prevNode.direction == 'nw'){
                            candidates.push(se);                        
                            candidates.push(s);                        
                        }
                        else if(prevNode.direction == 'se'){
                            candidates.push(nw);                        
                            candidates.push(w);                        
                        }
                        break;
                }  
            }
            else{
                // jct to mid                
                var dir = new THREE.Vector3(node.x - prevNode.x, 0, node.z - prevNode.z);            
                var next = new THREE.Vector3(node.x + dir.x, 0, node.z + dir.z);
                candidates.push(next);
                
                switch(node.direction){
                    case 'se':
                        if(next.distanceTo(ne) < next.distanceTo(sw))
                            candidates.push(ne);
                        else
                            candidates.push(sw);                        
                        break;
                    case 'ne':
                        if(next.distanceTo(nw) < next.distanceTo(se))
                            candidates.push(nw);
                        else
                            candidates.push(se);                        
                        break;
                    case 'nw':
                        if(next.distanceTo(sw) < next.distanceTo(ne))
                            candidates.push(sw);
                        else
                            candidates.push(ne);                        
                        break;
                    case 'sw':
                        if(next.distanceTo(nw) < next.distanceTo(se))
                            candidates.push(nw);
                        else
                            candidates.push(se);                        
                        break;
                }
            }
        }     
    }
    else if(node.type == 'jct'){                                       

        if(!prevNode){            
            var se = new THREE.Vector3(node.x + 0.25, 0, node.z + 0.25);
            var ne = new THREE.Vector3(node.x + 0.25, 0, node.z - 0.25);
            var nw = new THREE.Vector3(node.x - 0.25, 0, node.z - 0.25);
            var sw = new THREE.Vector3(node.x - 0.25, 0, node.z + 0.25);
            candidates.push(se);
            candidates.push(ne);
            candidates.push(nw);
            candidates.push(sw);
        }
        else{
            var dirs = [];
            dirs.push(new THREE.Vector3(+0.25, 0, +0.25));
            dirs.push(new THREE.Vector3(+0.25, 0, -0.25));
            dirs.push(new THREE.Vector3(-0.25, 0, -0.25));
            dirs.push(new THREE.Vector3(-0.25, 0, +0.25));
            var dir = new THREE.Vector3(prevNode.x - node.x, 0, prevNode.z - node.z);            
            
            var found = false;
            for(var i = 0; i < dirs.length && !found; ++i){                
                var dot = dir.dot(dirs[i]);
                if(dot && dot < 0){
                    candidates.push(new THREE.Vector3(node.x + dirs[i].x, 0, node.z + dirs[i].z));
                    found = true;
                }
            }
        }        
    }
    
    var candidateNodes = [];
    for(var i = 0; i < candidates.length; ++i){
        var nearest = this.nodesKdTree.nearest(candidates[i], 1, 0) ;
        if(nearest && nearest[0][1] == 0 && nearest[0][0].crossings)
            candidateNodes.push(nearest[0][0]);
    }             

    return candidateNodes;
}

Dots.zeroJctCrossings = function(node){
    if(node && node.type == 'jct')
        node.crossings = 0;
}


Dots.prototype.updateCrossings = function(dotPos, startNode, endNode){

    var e = this.nearestNode(dotPos, new THREE.Vector3(dotPos.x + 0.5, 0, dotPos.z));
    var n = this.nearestNode(dotPos, new THREE.Vector3(dotPos.x, 0, dotPos.z - 0.5));
    var w = this.nearestNode(dotPos, new THREE.Vector3(dotPos.x - 0.5, 0, dotPos.z));
    var s = this.nearestNode(dotPos, new THREE.Vector3(dotPos.x, 0, dotPos.z + 0.5));

    startNode.crossings--;
    endNode.crossings--;
    if(startNode.type == 'mid' && endNode.type == 'mid'){
        if(startNode.direction == 'se'){  
            if(endNode.direction == 'ne'){
                Dots.zeroJctCrossings(e);
            }   
            else if(endNode.direction == 'sw'){
                Dots.zeroJctCrossings(s);
            }       
        }
        else if(startNode.direction == 'ne'){            
            if(endNode.direction == 'se'){
                Dots.zeroJctCrossings(e);
            }   
            else if(endNode.direction == 'nw'){
                Dots.zeroJctCrossings(n);
            }       
        }
        else if(startNode.direction == 'nw'){            
            if(endNode.direction == 'ne'){
                Dots.zeroJctCrossings(n);
            }   
            else if(endNode.direction == 'sw'){
                Dots.zeroJctCrossings(w);
            }       
        }
        else if(startNode.direction == 'sw'){            
            if(endNode.direction == 'nw'){
                Dots.zeroJctCrossings(w);
            }   
            else if(endNode.direction == 'se'){
                Dots.zeroJctCrossings(s);
            }       
        }
    }
}