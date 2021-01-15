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
