/*
 * SnapPt.js
 * 
 * @author Sashi Vadakkepat - sashi@punchdialog.com
 * 
 */

var SnapPt = function(x, y, z, type, direction){
    this.x = x;
    this.y = y;
    this.z = z;
    this.type = type;
    this.direction = direction;
    this.position = new THREE.Vector3(x,y,z);
    if(type == 'mid')
        this.crossings = 2;
    else
        this.crossings = 4;
}
