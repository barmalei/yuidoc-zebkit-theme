# Yuidoc zebkit theme

![ScreenShot](/example.png)

Why this theme:
   * Use Java-like packages instead modules to organize you code 
   * Allow developers to describe in yuidoc documentation package level methods and variables   
   * Provide better look and feel and more handy navigation over an API yuidoc documentation
   

# Packages vs modules     

Packages are more abstract, universal way to organize and split to logical parts your code. Name of package is a sequence of names that split with "." character. For instance:
   * "org.apache.commons" package is a root package of all Apache commons modules. 
   * "org.apache.commons.io" is package that hosts classes, methods, other sub-packages of Java IO routine operations. It is packaged as JAR (module)  

# How to describe a package with yuidoc

In terms of the given theme a package is a special class that is tagged with "package" access. To describe a package you have to write the following:

```
    /**
     *  <Package description should be written here>  
     *  @class <package name>
     *  @access package 
     */

```


# Installation

```sh
$ npm install yuidoc-zebkit-theme
```


# Usage

```sh
$ yuidoc  -c yuidoc.json  -t .  <js_path>
```
