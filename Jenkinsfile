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
                if exist "C:\\Users\\rohit\\Downloads\\nginx-1.28.1\\nginx-1.28.1\\html" rmdir /s /q "C:\\Users\\rohit\\Downloads\\nginx-1.28.1\\nginx-1.28.1\\html"
                mkdir "C:\\Users\\rohit\\Downloads\\nginx-1.28.1\\nginx-1.28.1\\html"
                xcopy /E /I /Y frontend "C:\\Users\\rohit\\Downloads\\nginx-1.28.1\\nginx-1.28.1\\html"
                '''
            }
        }
    }
}
