require 'rubygems'
require 'sinatra'
  
require './enigmize.rb'

Encoding.default_external = 'utf-8'

run Sinatra::Application
