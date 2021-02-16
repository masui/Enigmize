# -*- coding: utf-8 -*-
# -*- ruby -*-

$:.unshift File.expand_path 'lib', File.dirname(__FILE__)

# 標準ライブラリ
require 'sinatra'
require 'sinatra/cross_origin'
require 'mongo'
require 'json'

# ローカルライブラリ
# require 'gmail'
require 'ses.rb'

enable :cross_origin

configure do
  set :root, File.dirname(__FILE__)
  set :public_folder, settings.root + '/public'
end

# 公開鍵取得 - 名前を変えたい
get '/:name@:domain.ink' do |name,domain|
  puts "Getting Ink...................................."
  email = "#{name}@#{domain}"
  @email = email
  ink = ''
  timestamp = ''
  Mongo::Client.new(ENV['MONGODB_URI']) { |db|
    db[:users].find({ email: email }).each { |e|
      ink = e['ink'].gsub(/[\r\n]+/,"\n")
      timestamp = e['timestamp']
    }
  }
  [ink, timestamp].join("\t")
end

get '/:name@:domain.enigmizer' do |name,domain|
  puts "Get /:name@:domain.enigmizer.........................."
  email = "#{name}@#{domain}"
  @email = email
  enigmizer = ''
  Mongo::Client.new(ENV['MONGODB_URI']) { |db|
    db[:users].find({ email: email }).each { |e|
      enigmizer = e['ink'].gsub(/[\r\n]+/,"\n")
    }
  }
  enigmizer
end

# get '/masui@sfc.keio.ac.jp' do
#   @name = 'masui'
#   @domain = 'sfc.keio.ac.jp'
#   @email = "masui@sfc.keio.ac.jp"
#   @timestamp = ''
#   db.find({ email: @email }).each { |e|
#     @timestamp = e['timestamp'].to_s
#     @ink = e['ink']
#   }
#   erb :page_new
# end

get '/:name@:domain' do |name,domain|
  puts "Get /:name@:domain....................................."
  @name = name
  @domain = domain
  @email = "#{name}@#{domain}"
  @timestamp = ''
  Mongo::Client.new(ENV['MONGODB_URI']) { |db|
    db[:users].find({ email: @email }).each { |e|
      @timestamp = e['timestamp'].to_s
      @ink = e['ink']
    }
  }

  erb :page
end

get '/:any' do |any|
  puts any
  puts "ANY..................................................."
  "http://enigmize.com/example@example.com のようなURLを指定してください"
end

get '/' do
  redirect "/index.html"
end

post '/__save_public_key' do
  key = URI.decode(params[:key])
  timestamp = params[:timestamp].to_s
  email = params[:email]
  Mongo::Client.new(ENV['MONGODB_URI']) { |db|
    db[:users].delete_many({ email: email })
    data = {
      email: email,
      ink: key,
      timestamp: timestamp # 鍵作成時のタイムスタンプ
    }
    db[:users].insert_one(data)
  }
  ''
end

post '/__send_data' do
  data = Base64.decode64(params[:body])
  filename = params[:filename]
  message = params[:message].to_s
  email = params[:email]
  puts "send email to #{email}"

  enigmadir = "/tmp/enigmadata"
  datadir = "#{enigmadir}/#{email}"
  datafile = "#{datadir}/#{filename}"
  Dir.mkdir(enigmadir) unless File.exist?(enigmadir)
  Dir.mkdir(datadir) unless File.exist?(datadir)
  File.open(datafile,"w"){ |f|
    f.print data
  }
  message = "暗号化データが届きました" if message == ""
  sendmail(email, "Enigmize.com: #{message}",
           (message == '' ? '' : "#{message}\n\n") +
           "#{filename} を http://Enigmize.com/#{email} にDrag&Dropして復号できます。",
           datafile)
  ''
end

post '/__send_code' do
  code = params[:code]
  email = params[:email]
  sendmail(email, "Enigmize.com 鍵作成用コード",
           "鍵作成のコードは「#{code}」です。")
  ''
end
