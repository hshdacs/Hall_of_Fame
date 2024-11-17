pipeline {
    agent any
    tools {
        nodejs 'nodejs' 
    }
    environment {
       
        HEROKU_API_KEY = credentials('HEROKU_API_KEY')
    }
    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }
        stage('Build') {
             steps {
                 dir('webui') {
                     echo 'Building Frontend...'
                     sh 'dir'
                     sh 'docker build -t jobpilot  .'
                 }
             }


        }
        stage('Deploy') {
            steps {
                dir('webui') {
                    echo 'Deploying to Heroku...'
                    script {
                        sh '''
                            echo "$HEROKU_API_KEY" | docker login --username=_ --password-stdin registry.heroku.com
                            docker tag jobpilot registry.heroku.com/jobpilotv3/web
                            docker push registry.heroku.com/jobpilotv3/web
                            heroku container:release web --app jobpilotv3
                        '''
                    }
                }
            }
        }
    }
    post {
        always {
            echo 'Cleaning up...'
            sh 'docker rmi jobpilot'
        }
    }
}


