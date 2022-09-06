#!/usr/bin/env bash

URL=localhost:3000
myfunction () {
    ARG=$URL/name/$1
    echo Calling HTTP-server: curl $ARG
    curl $ARG
}

myfunction 01-Andy &
myfunction 02-Brett &
myfunction 03-Cesar &
myfunction 04-David &
myfunction 05-Eric &
myfunction 06-Felix &
myfunction 07-Greg &
myfunction 08-Hardy &
myfunction 09-Indy &
myfunction 10-JarJar &
