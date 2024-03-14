# CS4600 - Project 2
In this [project](https://graphics.cs.utah.edu/courses/cs4600/fall2023/?prj=2) we will implement transformations using JavaScript.

The missing part of this application (the part you will implement) consists of two JavaScript function. The first one, `GetTransform`, returns a 3x3 transformation matrix defined by the given transformation arguments. Correctly implementing this function is sufficient for applying the correct transformation to the UAV body. Here what this function looks like:

`function GetTransform( positionX, positionY, rotation, scale )`

This function takes 4 input parameters: `positionX` and `positionY` define the translation component and the other two parameters define the rotation (in degrees) and the scale components. The returned transformation should first apply scale, then rotation, and finally translation. The transformation is matrix is returned as a 1D array of values in column-major format, such that the array indices correspond to the matrix values as below:
```
array[0] 	array[3] 	array[6]
array[1] 	array[4] 	array[7]
array[2] 	array[5] 	array[8]
```

The second function you should implement, `ApplyTransform`, takes two 3x3 transformation matrices and returns the resulting transformation as a combined 3x3 transformation matrix, all in the same column-major format as above. Here is what this function looks like:

`function ApplyTransform( trans1, trans2 )`

The returned transformation should first apply trans1 and then trans2. This second function is needed for applying the local transformations of the four propellers before applying the transformation of the UAV body. This is how the propellers are placed at their correct positions.

# Demo
[Finished Project](https://cs4600.irlqt.me/project_2/)

![Project Screenshot](https://cs4600.irlqt.me/project_2/screenshot.jpg "Project 2 Screenshot")

-----

![A woman is memerized by computer displays](https://cs4600.irlqt.me/project_2/saint.jpg "Patron Saint of this Repository")
P.S. I Love you
