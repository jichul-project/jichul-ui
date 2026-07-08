pipeline {
  agent {
    label "mac-mini"
  }

  environment {
    IMAGE_REGISTRY = "ghcr.io"
    IMAGE_NAME     = "ghcr.io/jichul-project/jichul-ui"
    GITHUB_CREDS   = credentials("Github")      // usr, psw 자동 주입
    SLACK_CHANNEL  = "jenkins"                  // 채널명 변수화
  }

  options {
    buildDiscarder(logRotator(numToKeepStr: "10"))
    timeout(time: 30, unit: "MINUTES")
    timestamps()
  }

  stages {
    stage("Initialize") {
      steps {
        script {
          slackSendForBuildStatus("STARTED")
        }
      }
    }

    stage("Checkout") {
      steps {
        checkout scm

        script {
          slackSendForBuildStatus("CHECKOUT")
        }
      }
    }

    stage("Docker Build and Push") {
      steps {
        sh """
          docker build --platform linux/amd64 --provenance false --sbom false --build-arg NEXT_PUBLIC_GA_ID=${env.NEXT_PUBLIC_GA_ID} -t ${IMAGE_NAME}:latest .
        """

        sh """
          echo \$GITHUB_CREDS_PSW | docker login ${IMAGE_REGISTRY} -u \$GITHUB_CREDS_USR --password-stdin

          docker push ${IMAGE_NAME}:latest
        """

        script {
          slackSendForBuildStatus("BUILD-AND-PUSH")
        }
      }
    }

    stage("Cleanup") {
      steps {
        sh """
          docker system prune -f || true
          docker rmi ${IMAGE_NAME}:latest || true
          docker logout ${IMAGE_REGISTRY} || true
        """
      }
    }
  }

  post {
    success {
      slackSendForBuildStatus("SUCCESSFUL")
    }
    failure {
      slackSendForBuildStatus("FAILURE")
    }
    aborted {
      slackSendForBuildStatus("ABORTED")
    }
    always {
      cleanWs()
    }
  }
}

// --------------------------------------------------------
// Helper Functions
// --------------------------------------------------------

def getTriggerUser() {
    def buildCauses = currentBuild.getBuildCauses()
    def manualCause = buildCauses.find { it._class == 'hudson.model.Cause$UserIdCause' }

    if (manualCause) {
        return manualCause.userId
    }
    return buildCauses.size() > 0 ? buildCauses[0].shortDescription : "Automated Trigger"
}

def slackSendForBuildStatus(String buildStatus = "STARTED") {
    def colorMap = [
        "STARTED": "#00BFFF",
        "SUCCESSFUL": "#00FF00",
        "FAILURE": "#FF0000",
        "ABORTED": "#808080",
        "CHECKOUT": "#FFF200",
        "BUILD-AND-PUSH": "#FF9900"
    ]

    def statusMap = [
        "STARTED": ":checkered_flag: Started",
        "SUCCESSFUL": ":white_check_mark: Success",
        "FAILURE": ":x: Failed",
        "ABORTED": ":white_circle: Aborted",
        "CHECKOUT": ":bulb: Checkout",
        "BUILD-AND-PUSH": ":docker: Build and Push"
    ]

    if (env.TRIGGER_USER == null) {
        env.TRIGGER_USER = getTriggerUser()
    }

    // 소요 시간 계산
    long currentTime = System.currentTimeMillis()
    if (env.START_TIME == null) env.START_TIME = currentTime.toString()
    if (env.LAST_TIME == null) env.LAST_TIME = currentTime.toString()

    def durationStr = ""
    if (buildStatus == "SUCCESSFUL" || buildStatus == "FAILURE" || buildStatus == "ABORTED") {
        long diff = (currentTime - env.START_TIME.toLong()) / 1000
        long m = diff / 60
        long s = diff % 60
        durationStr = " (총 소요 시간: ${m}분 ${s}초)"
    } else if (buildStatus != "STARTED") {
        long diff = (currentTime - env.LAST_TIME.toLong()) / 1000
        long m = diff / 60
        long s = diff % 60
        durationStr = m > 0 ? " (${m}분 ${s}초 소요)" : " (${s}초 소요)"
    }
    env.LAST_TIME = currentTime.toString()

    def color = colorMap[buildStatus] ?: "#FFF200"
    def status = statusMap[buildStatus] ?: buildStatus
    def summary = "${env.JOB_NAME} - <${env.BUILD_URL}|#${env.BUILD_NUMBER}> ${status}${durationStr}"
    def fields = []

    if (buildStatus == "STARTED") {
        fields.add([
            "title": "${env.TRIGGER_USER}",
            "value": "Node - ${env.NODE_NAME}",
            "short": true
        ])
    }

    if (buildStatus in ["CHECKOUT"]) {
        def changeLog = ""

        def tryGitLog = { String range ->
            try {
                return sh(script: "git log ${range} --pretty=format:'• `%h` %s _(%an)_'", returnStdout: true).trim()
            } catch (Exception e) {
                echo "git log (${range}) failed: ${e.getMessage()}"
                return ""
            }
        }

        if (env.GIT_PREVIOUS_COMMIT) {
            echo "git log GIT_PREVIOUS_COMMIT"
            changeLog = tryGitLog("${env.GIT_PREVIOUS_COMMIT}..${env.GIT_COMMIT}")
        }

        if (!changeLog?.trim() && env.GIT_PREVIOUS_SUCCESSFUL_COMMIT) {
            echo "git log GIT_PREVIOUS_SUCCESSFUL_COMMIT"
            changeLog = tryGitLog("${env.GIT_PREVIOUS_SUCCESSFUL_COMMIT}..${env.GIT_COMMIT}")
        }

        if (!changeLog?.trim()) {
            echo "git log -1"
            changeLog = tryGitLog("-1")
        }

        if (!changeLog?.trim()) {
            changeLog = "_No changes in this build._"
        }

        fields.add([
            "title": "Changes",
            "value": changeLog,
            "short": false
        ])
    }

    // fields가 비어있을 경우 null로 처리하여 빈 값이 전송되지 않도록 방지
    if (fields.isEmpty()) {
        fields = null
    }

    def attachments = [[
        "fallback": summary,
        "color": color,
        "title": summary,
        "fields": fields
    ]]

    if (buildStatus == "STARTED") {
        def response = slackSend(channel: env.SLACK_CHANNEL, attachments: attachments)
        env.SLACK_THREAD_ID = response.threadId
    } else if (env.SLACK_THREAD_ID != null) {
        slackSend(channel: env.SLACK_THREAD_ID, attachments: attachments)
    } else {
        slackSend(channel: env.SLACK_CHANNEL, attachments: attachments)
    }
}
