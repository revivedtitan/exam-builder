function enableTimer() {
    var isExamTimed = $('#timedExamChkBox').is(':checked');
    $('#numberOfMinutes').prop("disabled", !isExamTimed);
}

function toggleTimerPanel() {
    $('#panel-timer').slideToggle();
}

function saveCorrectQuestionList() {
    var currentTime = new Date();
    var time = currentTime.getHours() + "H-" + currentTime.getMinutes() + "M-" + currentTime.getSeconds() + "S";
    currentTime = currentTime.toLocaleFormat('%d-%b-%Y');
    var filename = 'Exam_Builder__Correct_Questions__' + currentTime + "__" + time;
    var data = "text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exam.correctlyAnswered));
    $('#correctly_answered_list_link').remove();
    $('<a id="correctly_answered_list_link" href="data:' + data + '" download="' + filename + '.json" style="display:none;"></a>').appendTo('#examCompletedPanel');
    $('#correctly_answered_list_link')[0].click();
}

function saveIncorrectQuestionList() {
    var currentTime = new Date();
    var time = currentTime.getHours() + "H-" + currentTime.getMinutes() + "M-" + currentTime.getSeconds() + "S";
    currentTime = currentTime.toLocaleFormat('%d-%b-%Y');
    var filename = 'Exam_Builder__Incorrect_Questions__' + currentTime + "__" + time;
    var data = "text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exam.wronglyAnswered));
    $('#wrongly_answered_list_link').remove();
    $('<a id="wrongly_answered_list_link" href="data:' + data + '" download="' + filename + '.json" style="display:none;"></a>').appendTo('#examCompletedPanel');
    $('#wrongly_answered_list_link')[0].click();
}

function endExam() {
    $('#navbar li').removeClass('disabled');
    $('#navbar-btn-end').hide();
    $('#navbar-btn-start').show();
    $('#nav-mobile').show();
    $('#questionBuilder').show();
    $('#examPanel').hide();
    $('#examCompletedPanel').hide();
    $('#navbar-btn-start').removeClass('disabled');
    $('#examFinishedBtn').hide();
    $('#question_counter').html(questions.length + ' Questions Loaded');
    $('#navbar-btn-timer').hide();
    $('#panel-timer').hide();
    stopClock();
}

function checkDisabledOptions() {
    if (questions.length > 0) {
        $('#exam-navbar li.disabled').removeClass('disabled');
        $('#navbar li.disabled').removeClass('disabled');
        $('#navbar-btn-summary').addClass('disabled');
        
		if(hideQuestionBar){
			$('#nav-mobile').show();
		}
    }
}

function showTestPanel() {
    $('#nav-mobile').hide();
    $('#questionBuilder').hide();
    $('#navbar li').addClass('disabled');
    $('#navbar-btn-start').addClass('disabled');
    $('#navbar-btn-summary').removeClass('disabled');
    beginExam();
    $('#examPanel').show();
}

function loadExamQuestion(question) {
    $('#exam-answers').html("");
    $('#exam-note').html("");
    $('#exam-answer-result').html("");
    $('#exam-answer-result').removeClass("incorrectAnswer");
    $('#exam-answer-result').removeClass("correctAnswer");
	$('#exam-question-type').val(question.type);
    $('#exam-question-text').html(question.text);

    var answerLetters = ['A', 'B', 'C', 'D', 'E', 'F'];

    if (question.preserveOrder == false && question.type != "TRUE_FALSE") {
        question.answers = shuffle(question.answers);
    }

    if (question.type == "CHECK_ALL") {
        $.each(question.answers, function(aKey, aValue) {
            var newAnswer = '<p><input name="exam-answers" type="checkbox" id="' + answerLetters[aKey] + '" value="' + aValue.text + '" class="with-gap" /><label for="' + answerLetters[aKey] + '">' + aValue.text.trim() + '</label></p>';
            $('#exam-answers').append(newAnswer);
        });
    } else {
        $.each(question.answers, function(aKey, aValue) {
            var newAnswer = '<p><input name="exam-answers" type="radio" id="' + answerLetters[aKey] + '" value="' + aValue.text + '" class="with-gap" /><label for="' + answerLetters[aKey] + '">' + aValue.text.trim() + '</label></p>';
            $('#exam-answers').append(newAnswer);
        });
    }
}

function checkExamQuestionAnswer() {
	var selectedAnswers = $('input[name=exam-answers]:checked')
	
    if (selectedAnswers.length == 0) {
        $('#errorModalMessage').html('Please select an answer!');
        $('#errorModal').modal('open');
        return;
    }

	var userAnswers=[];
	
	$.each(selectedAnswers, function(index,answer){
		userAnswers.push($(answer).val());
	});

    var correctAnswers = getAnswers(exam.currentQuestion);

	if(userAnswers.sort().compare(correctAnswers.sort())) {
		exam.correctlyAnswered.push(exam.currentQuestion);
		$('#exam-answer-result').html("Good job, please continue to the next question..").addClass('correctAnswer');
	} else {
		exam.wronglyAnswered.push(exam.currentQuestion);
		$('#exam-answer-result').html("Incorrect, please continue to the next question..").addClass('incorrectAnswer');
	}
	
	var questionType = $('#exam-question-type').val();
	var formAnswerType = ':radio[value="';
	
	if(questionType == CHECK_ALL){
		formAnswerType = ':checkbox[value="';
	}
	
		$.each(userAnswers, function(index, answer){
				var element = formAnswerType + answer + '"]';
				$(element).parent().find('label').addClass('incorrectAnswer');
		});
		
		$.each(correctAnswers, function(index, answer){
				var element = formAnswerType + answer + '"]';
				$(element).parent().find('label').removeClass('incorrectAnswer');
				$(element).parent().find('label').addClass('correctAnswer');
		});
		
		updateTestSummary();

    $('#exam-note').html(exam.currentQuestion.note);
    $('#examSubmitBtn').hide();

    if (exam.currentQuestionCount == exam.totalQuestionCount) {
        $('#examFinishedBtn').show();
    } else {
        $('#examContinueBtn').show();
    }
}

function resetSummary() {
    $('.summary-correctly-answered').html("0");
    $('.summary-wrongly-answered').html("0");
    $('.summary-unanswered').html("0");
    $('.summary-total-questions').html(exam.totalQuestionCount);
    $('.summary-passing-percent').html($('#passingPercentage').val() + "%");
    $('.summary-percent').html('0%');
    $('.determinate').css('width', '0%');
}

function beginExam() {
    exam = new Exam();
    var count = $('#numberOfQuestions').val();
    exam.totalQuestionCount = count;
    exam.questions = getUnique(count, questions);
    exam.questions = shuffle(exam.questions);
    $('#navbar-btn-end').show();
    $('#navbar-btn-start').hide();
    resetSummary();
    advanceExam();

    var isExamTimed = $('#timedExamChkBox').is(':checked');

    if (isExamTimed) {
        $('#panel-timer').show();
        var deadline = moment().add(parseInt($('#numberOfMinutes').val()), 'm');
        initializeClock('panel-timer', deadline);
        $('#navbar-btn-timer').show();
    }
}

function advanceExam() {
    exam.currentQuestion = exam.questions.pop();
    loadExamQuestion(exam.currentQuestion);
    $('#examSubmitBtn').show();
    $('#examContinueBtn').hide();
    exam.currentQuestionCount++;
    $('#question_counter').html('Question ' + exam.currentQuestionCount + ' of ' + exam.totalQuestionCount);
}

function updateTestSummary() {
    $('.summary-correctly-answered').html(exam.correctlyAnswered.length);
    $('.summary-wrongly-answered').html(exam.wronglyAnswered.length);
    $('.summary-unanswered').html(exam.totalQuestionCount - exam.currentQuestionCount);
    $('.summary-percent').html(exam.calculateGrade() + "%");
    $('.determinate').css('width', exam.calculateExamProgress() + '%');
}

function finishExam() {
    var summary = $("#examSummary").find('.modal-content').clone();
    $('#examSummaryClone').html(summary);
    $('#navbar-btn-summary').addClass('disabled');
    $('#examPanel').hide();
    $('#examCompletedPanel').show();
    $('#question_counter').html('Final Grade: ' + exam.calculateGrade() + '%');

    if (exam.correctlyAnswered.length > 0) {
        $('#downloadCorrectBtn').show()
    } else {
        $('#downloadCorrectBtn').hide()
    }

    if (exam.wronglyAnswered.length > 0) {
        $('#downloadIncorrectBtn').show()
    } else {
        $('#downloadIncorrectBtn').hide()
    }

    var passingGrade = parseFloat($('#passingPercentage').val());

    if (exam.calculateGrade() >= passingGrade) {
        $('#verdict').html('Congratulations you passed!');
    } else {
        $('#verdict').html("Unfortunately you did not meet the passing grade. Let's study some more and try again!");
    }
    stopClock();
}