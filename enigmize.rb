# -*- coding: utf-8 -*-
# -*- ruby -*-

$:.unshift File.expand_path 'lib', File.dirname(__FILE__)

# 標準ライブラリ
require 'sinatra'
# require 'mongo'
require 'json'

#configure do
#  set :root, File.dirname(__FILE__)
#  set :public_folder, settings.root + '/public'
#end

get '/:name@:domain' do |name,domain|
  @name = name
  @domain = domain
  erb :page
end

get '/:any' do |any|
  "ANY"
end

get '/' do
  "index.html"
end
