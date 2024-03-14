# CS4600 - Project 1
In this [project](https://graphics.cs.utah.edu/courses/cs4600/fall2023/?prj=1) we will implement an alpha compositing function for raster images using JavaScript.

The missing part of this application (the part you will implement) is the JavaScript function that composites a foreground image onto a background image using alpha blending. Here how that function looks like:

`function composite( bgImg, fgImg, fgOpac, fgPos )`

This function takes 4 input parameters:
```
    bgImg is the given background image to be modified.
    fgImg is the foreground image that is to be composited onto the background image.
    fgOpac is the opacity of the foreground image. The alpha values of the foreground image should be scaled using this argument.
    fgPos is the position of the foreground image on the background image. It holds x and y coordinates in pixels, such that x=0 and y=0 means that the top-left pixels of the foreground and background images are aligned. Note that the given x and y coordinates can be negative.
```
This function does not return anything. It just modifies the given background image. The foreground image may have a different size and its position can be negative. The parts of the foreground image that fall outside of the background image should be ignored.

# Demo
[Finished Project](https://cs4600.irlqt.me/project_1)

![Project Screenshot](https://cs4600.irlqt.me/project_1/screenshot.jpg "Project 1 Screenshot")

-----

![A woman is memerized by computer displays](https://cs4600.irlqt.me/project_1/2.png "Patron Saint of this Repository")
P.S. I Love you
