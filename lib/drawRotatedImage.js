CanvasRenderingContext2D.prototype.drawRotatedImage = function(image, x, y, width, height, angle) {
    var context = this;
    context.save();
    context.translate(x, y);
    context.rotate(angle);
    context.drawImage(image, -(width / 2), -(height / 2), width, height);
    context.restore();
}