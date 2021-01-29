# -*- coding: utf-8 -*-
# -*- ruby -*-

$:.unshift File.expand_path 'lib', File.dirname(__FILE__)

# 標準ライブラリ
require 'sinatra'
require 'sinatra/cross_origin'
require 'mongo'
require 'json'

# ローカルライブラリ
require 'gmail'

enable :cross_origin

configure do
  set :root, File.dirname(__FILE__)
  set :public_folder, settings.root + '/public'
end

def db
  unless @db
    @db = Mongo::Client.new(ENV['MONGODB_URI'])[:users]
  end
  @db
end

get '/:name@:domain.ink' do |name,domain|
  #content_type :text
  #headers 'Access-Control-Allow-Origin' => '*',
  #        'Access-Control-Allow-Methods' => ['OPTIONS', 'GET', 'POST'],
  #        'Access-Control-Allow-Credentials' => true 
  #headers['Access-Control-Allow-Origin'] = '*'
  #headers['Access-Control-Allow-Methods'] = ['OPTIONS', 'GET', 'POST']
  #headers['Access-Control-Allow-Credentials'] = true 

  email = "#{name}@#{domain}"
  @email = email
  ink = ''
  db.find({ email: email }).each { |e|
    ink = e['ink'].gsub(/[\r\n]+/,"\n")
  }
  ink
end

get '/:name@:domain' do |name,domain|
  @name = name
  @domain = domain
  @email = "#{name}@#{domain}"
  $email = @email
  db.find({ email: @email }).each { |e|
    @ink = e['ink']
  }

  erb :page
end

get '/:any' do |any|
  "ANY"
end

get '/' do
  redirect "/index.html"
end

post '/__save_public_key' do
  key = URI.decode(params[:key])
  db.delete_many({ email: @email })
  db.delete_many({ name: 'masui' })
  # db.delete_many({ }) # 全部消す

  data = {
    email: $email,
    ink: key
  }
  db.insert_one(data)
  puts key
  ''
end

post '/__send_data' do
  data = Base64.decode64(params[:body])
  filename = params[:filename]
  message = params[:message]

  enigmadir = "/tmp/enigmadata"
  datadir = "#{enigmadir}/#{$email}"
  datafile = "#{datadir}/#{filename}"
  Dir.mkdir(enigmadir) unless File.exist?(enigmadir)
  Dir.mkdir(datadir) unless File.exist?(datadir)
  File.open(datafile,"w"){ |f|
    f.print data
  }
  sendmail($email, "Enigmize.comから暗号化データが届きました",
           (message == '' ? '' : "#{message}\n\n") +
           "#{filename} を http://Enigmize.com/#{$email} にDrag&Dropして復号できます。",
           datafile)
  ''
end

post '/__send_code' do
  code = params[:code]
  sendmail($email, "Enigmize.com 鍵作成用コード",
           "鍵作成のコードは「#{code}」です。")
  ''
end
