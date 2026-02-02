pipeline {
    agent any

    stages {
        stage('Checkout') {
            steps {
                echo 'Checking out code'
            }
        }

        stage('Install Dependencies') {
            steps {
                bat 'npm install'
            }
        }

        stage('Build') {
            steps {
                echo 'Build completed'
            }
        }

        stage('Deploy Frontend to Nginx') {
            steps {
                bat '''
                if exist C:\\nginx\\html rmdir /s /q C:\\nginx\\html
                mkdir C:\\nginx\\html
                xcopy /E /I /Y frontend C:\\nginx\\html
                '''
            }
        }
    }
}
