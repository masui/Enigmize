require 'base64'  # standard library
require 'aws-sdk' # gem install aws-sdk
require 'mime'    # gem install mime

# Enigmize@gmail.com からAmazon SES経由でメールを送る
# 添付ファイルがある場合と無い場合で処理を変える

def sendmail(recipient, subject, body, file = nil)
  # SESで認証されている必要がある
  sender = "enigmize@gmail.com"
  sendername = "Enigmizer"

  # Specify a configuration set. 
  # configsetname = "ConfigSet" # よくわからないので使わない

  # Specify the text encoding scheme.
  encoding = "UTF-8"

  awsregion = "us-west-2"

  # The subject line for the email.
  # subject = "Customer service contact info"

  # Create a new SES resource and specify a region
  ses = Aws::SES::Client.new(region: awsregion)

  if !file then
    textbody = body
    htmlbody = body

    # Try to send the email.
    begin
      # Provide the contents of the email.
      resp = ses.send_email(
        {
          destination: {
            to_addresses: [
              recipient,
            ],
          },
          message: {
            body: {
              html: {
                charset: encoding,
                data: htmlbody,
              },
              text: {
                charset: encoding,
                data: textbody,
              },
            },
            subject: {
              charset: encoding,
              data: subject,
            },
          },
          source: sender,
          # Comment or remove the following line if you are not using 
          # a configuration set
          # configuration_set_name: configsetname,
        })
      puts "Email sent!"

    # If something goes wrong, display an error message.
    rescue Aws::SES::Errors::ServiceError => error
      puts "Email not sent. Error message: #{error}"
    end
    
  else
    # The full path to the file that will be attached to the email.
    attachment = file

    # The email body for recipients with non-HTML email clients.  
    textbody = body

    # The HTML body of the email.
    htmlbody = """
<html>
<head></head>
<body>
<pre>
#{body}
</pre>
</body>   
</html>   
"""       

    # Create a new MIME text object that contains the base64-encoded content of the
    # file that will be attached to the message.
    file = MIME::Application.new(Base64::encode64(open(attachment,"rb").read))

    # Specify that the file is a base64-encoded attachment to ensure that the 
    # receiving client handles it correctly. 
    file.transfer_encoding = 'base64'
    file.disposition = 'attachment'

    # Create a MIME Multipart Mixed object. This object will contain the body of the
    # email and the attachment.
    msg_mixed = MIME::Multipart::Mixed.new

    # Create a MIME Multipart Alternative object. This object will contain both the
    # HTML and plain text versions of the email.
    msg_body = MIME::Multipart::Alternative.new

    # Add the plain text and HTML content to the Multipart Alternative part.
    msg_body.add(MIME::Text.new(textbody,'plain'))
    msg_body.add(MIME::Text.new(htmlbody,'html'))

    # Add the Multipart Alternative part to the Multipart Mixed part.
    msg_mixed.add(msg_body)

    # Add the attachment to the Multipart Mixed part.
    msg_mixed.attach(file, 'filename' => attachment)

    # Create a new Mail object that contains the entire Multipart Mixed object. 
    # This object also contains the message headers.
    msg = MIME::Mail.new(msg_mixed)
    msg.to = { recipient => nil }
    msg.from = { sender => sendername }
    msg.subject = subject
    # msg.headers.set('X-SES-CONFIGURATION-SET',configsetname)

    # Try to send the email.
    begin
      # Provide the contents of the email.
      resp = ses.send_raw_email(
        {
          raw_message: {
            data: msg.to_s
          }
        })
      # If the message was sent, show the message ID.
      puts "Email sent! Message ID: " + resp[0].to_s

    # If the message was not sent, show a message explaining what went wrong.
    rescue Aws::SES::Errors::ServiceError => error
      puts "Email not sent. Error message: #{error}"
    end
  end
end

if __FILE__ == $0
  sendmail('masui@pitecan.com', 'Test from enigmize.com', 'test message without attachment')
  # sendmail('masui@pitecan.com', 'Test from enigmize.com', 'test message', '/home/masui/Enigmize/enigmize.rb')
end
