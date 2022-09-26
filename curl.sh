#!/usr/bin/env bash

URL=localhost:30000
getHTML () {
    ARG=$URL/name/$1
    echo Calling HTTP-server: curl $ARG
    curl $ARG
}

getHTML 01-Andy &
getHTML 02-Brett &
getHTML 03-Cesar &
getHTML 04-David &
getHTML 05-Eric &
getHTML 06-Felix &
getHTML 07-Greg &
getHTML 08-Hardy &
getHTML 09-Indy &
getHTML 10-JarJar &
