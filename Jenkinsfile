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

        stage('Deploy to Nginx') {
            steps {
                bat '''
                rmdir /s /q C:\\nginx\\html
                mkdir C:\\nginx\\html
                xcopy /E /I /Y . C:\\nginx\\html
                '''
            }
        }
    }
}
