#
# データベースはAtlasののMongoを使う
# URIはHEROKUに登録している
#  user: masui
#  pass: http://www.pitecan.com/p/Atlas_tmasui@gmail.com
#  collectionはenigmize
#

# backup:
# 	mongoexport --uri=`heroku config -a enigmize | grep MONGODB_URI | ruby -n -e 'puts $$_.split[1].sub(/\?.*$$/,"")'` -c users -o backup.json


#	git pull
#	-git commit -a -m backup	
#	-git push git@github.com:masui/GoQuick.git

# ローカルにSinatraを走らせる
local:
	-mkdir public/javascripts
	webpack
	MONGODB_URI=`heroku config -a enigmize | grep MONGODB_URI | ruby -n -e 'puts $$_.split[1]'` ruby enigmize.rb

clean:
	/bin/rm -f *~ */*~

# push:
# 	git add backups/*.json
# 	git commit -a -m backup	
# 	git push git@github.com:masui/GoQuick.git

push:
 	git push git@github.com:masui/Enigmize.git

favicon:
	convert images/favicon.png -define icon:auto-resize=64,32,16 public/favicon.ico

cleandata:
	-/bin/rm ~/*.secretkey
	-/bin/rm ~/*.enigma
