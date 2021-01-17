# -*- coding: utf-8 -*-
# -*- ruby -*-

$:.unshift File.expand_path 'lib', File.dirname(__FILE__)

# 標準ライブラリ
require 'sinatra'
require 'mongo'
require 'json'

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
  email = "#{name}@#{domain}"
  @email = email
  ink = ''
  db.find({ email: email }).each { |e|
    ink = e['ink']
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

  @ink = "-----BEGIN RSA PUBLIC KEY-----\n" +
"MIIBigKCAYEAsErZ5vTvLG9q23sqyu0l2IY89oDyrCLNkabubDyXP+/lF/ON0KWJ\n" +
"wGYf1QnH5wKk1Pk51YQRaNrK4BrBtUPOmx0mdypoyuPuB3U5wp/7/d8vFCe74DV6\n" +
"SQQN+i1j7l4CMS26kH4x9N75IP6fr56lgqx0kEynUAn67KSu7Jhzu1TWOwe+4odo\n" +
"TJYpxWAv41F+0dTUTHgpDP1+hatReGu3qL2TuH+rg47SA4kpKMNEwkRMcofUThMr\n" +
"0R8Uc1upstlefuEz54HSFjVg2qrJ7Tb9FE+eAhqs/CKIdv/U64kyLkwKCQwX6z86\n" +
"F0/Ksmbbh8FY4pP8QcN1sol5P1NsBSz/UTemif7TS1ZR6TIhWpa8gYlYXVHs4WpH\n" +
"LvvvBT0LNs6QDzmiydO1LjWmCyYEhceNvWKXHo3EUQr4RM9UPqVMpSlnRmqPVMQF\n" +
"NGTnD4cIuC4qa79Eu3NIUl3vZQj0z0NKFIOR2+wnVH7BKQEXVRxrr/ujvGAmf3xY\n" +
"uci3BMXRFqRLAgMBAAE=\n" +
"-----END RSA PUBLIC KEY-----\n"

  erb :page
end

get '/:any' do |any|
  "ANY"
end

get '/' do
  redirect "/index.html"
end

post '/__save_public_key' do
  key = params[:key]
  db.delete_many({ email: @email })
  db.delete_many({ name: 'masui' })
  db.delete_many({ }) # 全部消す

  data = {
    email: $email,
    ink: key
  }
  db.insert_one(data)
  puts key
  ''
end
