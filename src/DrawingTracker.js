export default class DrawingTracker {
  constructor(p) {
    this.p = p;
    this.isActive = false;
    this.points = [];
    this.startTime = 0;
    this.brushSize = 1;
    this.minX = 0;
    this.maxX = 0;
    this.minY = 0;
    this.maxY = 0;
  }

  startStroke(x, y, time, brushSize, strokeColor = "#000000") {
    this.isActive = true;
    this.points = [{ x, y }];
    this.startTime = time;
    this.brushSize = brushSize;
    this.strokeColor = strokeColor;
    
    this.minX = x;
    this.maxX = x;
    this.minY = y;
    this.maxY = y;
  }

  addPoint(x, y) {
    if (!this.isActive) return;
    this.points.push({ x, y });
    
    if (x < this.minX) this.minX = x;
    if (x > this.maxX) this.maxX = x;
    if (y < this.minY) this.minY = y;
    if (y > this.maxY) this.maxY = y;
  }

  endStroke() {
    this.isActive = false;
  }

  draw() {
    if (!this.isActive || this.points.length === 0) return;

    let p = this.p;
    let currentPt = this.points[this.points.length - 1];

    // Setup style for the tracker (Grey light stroke)
    p.push();
    p.stroke(150, 150, 150, 180);
    p.strokeWeight(1);
    p.noFill();

    // 1. Draw dashed line following the actual drawing trajectory
    // We can't use native p5 drawingContext.setLineDash on shapes reliably across all renderers, 
    // but on standard 2D context it works well.
    if (p.drawingContext && p.drawingContext.setLineDash) {
      p.drawingContext.setLineDash([5, 5]);
    }
    
    p.beginShape();
    for (let pt of this.points) {
      p.vertex(pt.x, pt.y);
    }
    p.endShape();

    // Reset dash for the rest of the shapes
    if (p.drawingContext && p.drawingContext.setLineDash) {
      p.drawingContext.setLineDash([]);
    }

    // 2. Draw Bounding Box around the stroke
    let padding = 10;
    let bx = this.minX - padding;
    let by = this.minY - padding;
    let bw = (this.maxX - this.minX) + padding * 2;
    let bh = (this.maxY - this.minY) + padding * 2;
    
    // Slight blue-ish grey for the box
    p.stroke(100, 120, 180, 120); 
    p.rectMode(p.CORNER);
    p.rect(bx, by, bw, bh);

    // 3. Draw a very faint internal grid for the bounding box
    p.stroke(100, 120, 180, 40);
    let gridCols = 5;
    let gridRows = Math.max(1, Math.floor((bh / bw) * gridCols));
    
    for (let i = 1; i < gridCols; i++) {
      let x = bx + (bw / gridCols) * i;
      p.line(x, by, x, by + bh);
    }
    for (let i = 1; i < gridRows; i++) {
      let y = by + (bh / gridRows) * i;
      p.line(bx, y, bx + bw, y);
    }

    // 4. Cursor dot (red circle at the tip)
    p.stroke(220, 50, 50, 200);
    p.strokeWeight(2);
    p.ellipse(currentPt.x, currentPt.y, 16, 16);

    // 5. Info Data (HUD Text)
    p.noStroke();
    p.fill(50, 50, 50, 200);
    p.textFont('monospace');
    p.textSize(10);
    p.textAlign(p.LEFT, p.BOTTOM);
    
    let timeSpent = p.millis() - this.startTime;
    let count = this.points.length;
    let size = this.brushSize.toFixed(1);
    
    // Relative coordinates to canvas center
    let cx = Math.round(currentPt.x - p.width / 2);
    let cy = Math.round(currentPt.y - p.height / 2);

    let hudTextBottom = `C: ${count} | S: ${size} | T: ${Math.floor(timeSpent)}ms | Col: ${this.strokeColor}`;
    let hudTextTop = `X: ${cx} | Y: ${cy}`;

    p.text(hudTextTop, bx, by - 5);
    p.text(hudTextBottom, bx, by + bh + 15);

    p.pop();
  }
}
