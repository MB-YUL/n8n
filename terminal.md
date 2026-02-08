Pour copier des fichiers directement dans le dossier monté dans ton pod, utilise ceci :

`-r` permet la copie récursive si tu veux déplacer un dossier complet.
 
`scp -r i_am_the_beast docker-test@172.16.1.100:compose/n8n`
 
`Pour i_am_the_beast`, c’est le chemin où se trouve ton fichier ou dossier local.