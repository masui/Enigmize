#
# データベースはAtlasののMongoを使う
# URIはHEROKUに登録している
#  user: masui
#  pass: http://www.pitecan.com/p/Atlas_tmasui@gmail.com
#  collectionはenigmize
#
# メール送信はGMailを使う
# address: enigmize@gmail.com
# pass: http://www.pitecan.com/p/Google_enigmize@gmail.com.html
#

# ローカルにSinatraを走らせる
local:
	-mkdir public/javascripts
	webpack
	MONGODB_URI=`heroku config -a enigmize | grep MONGODB_URI | ruby -n -e 'puts $$_.split[1]'` ruby enigmize.rb

backup:
	mongoexport --uri=`heroku config -a enigmize | grep MONGODB_URI | ruby -n -e 'puts $$_.split[1].sub(/\?.*$$/,"")'` -c users -o backup.json


clean:
	/bin/rm -f *~ */*~

push:
	webpack
 	git push git@github.com:masui/Enigmize.git

favicon:
	convert images/favicon.png -define icon:auto-resize=64,32,16 public/images/favicon.ico

cleandata:
	-/bin/rm ~/*.secretkey
	-/bin/rm ~/*.enigma

mailtest:
	GMAIL_APP_PASSWORD=`heroku config -a enigmize| grep GMAIL_APP_PASSWORD | ruby -n -e 'puts $$_.split[1]'` ruby lib/gmail.rb

restart:
	heroku restart -a enigmize
