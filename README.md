# Yuidoc zebkit theme

![ScreenShot](/example-dark.png)

Why this theme:
   * Use Java-like packages instead modules to organize you code 
   * Allow developers to describe in yuidoc documentation package level methods and variables   
   * Provide better look and feel and more handy navigation over an API yuidoc documentation
   * This theme has light and dark versions
   

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

The package requires nodejs to be installed. 

  * Install required third party packages:
```sh
  $ npm  install
```

  * Re-build this theme artifacts: 
```sh
$ gulp 
```

# Usage

To generate examples light or dark theme run the following command:
```sh
$ gulp light  
```

or 

```sh
$ gulp dark  
```

You can find and open in a browser results of API doc generation in "apidoc-light" or "apidoc-dark" folder correspondingly.   

To generate API doc for a project run the following command: 

```sh
$ yuidoc  -c yuidoc.json  -t .  <js_path>
```
