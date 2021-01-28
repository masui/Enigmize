require 'mail'

# Enigmize@gmail.comからメールを送る

def sendmail(to, subject, body)
  from   = 'enigmize@gmail.com'
  password = ENV['GMAIL_APP_PASSWORD']

  Mail.defaults do
    delivery_method :smtp, {
                      :address => 'smtp.gmail.com',
                      :port => 587,
                      :domain => 'enigmize.com', # ????
                      :user_name => from,
                      :password => password,
                      :authentication => :login,
                      :enable_starttls_auto => true
                    }
  end

  m = Mail.new do
    from "#{from}"
    to "#{to}"
    subject "#{subject}"
    body "#{body}"
  end

  m.charset = "UTF-8"
  m.content_transfer_encoding = "8bit"
  m.deliver
end

if __FILE__ == $0
  sendmail('masui@pitecan.com', 'Test from enigmize.com', 'body')
end
