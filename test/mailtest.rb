require 'mail'

mail_from   = 'enigmize@gmail.com'
mail_passwd = ENV['GMAIL_APP_PASSWORD']
mail_to     = 'masui@pitecan.com'
mail_subject= 'test from enigmize@gmail'
mail_body   = <<EOS
メール本文
EOS

Mail.defaults do
  delivery_method :smtp, {
    :address => 'smtp.gmail.com',
    :port => 587,
    :domain => 'example.com',
    :user_name => "#{mail_from}",
    :password => "#{mail_passwd}",
    :authentication => :login,
    :enable_starttls_auto => true
  }
end

m = Mail.new do
  from "#{mail_from}"
  to "#{mail_to}"
  subject "#{mail_subject}"
  body <<EOS
#{mail_body}
EOS

end

m.charset = "UTF-8"
m.content_transfer_encoding = "8bit"
m.deliver
