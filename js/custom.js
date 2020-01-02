/* Custom scrips for my portfolio - Jonathan Gabrielli 2016-2020*/

$(document).ready(function() {
	$("body").css("display", "none");
});
$(function(){
	$("#header").load("header.html");
	$("#footer").load("footer.html");
	
	$('[lang="en"]').hide();
});

$(document).ready(function() {
	$("body").css("display", "none");
	$("body").fadeIn(1000);
});
$("a.transition").click(function(event){
	event.preventDefault();
	linkLocation = this.href;
	$("body").fadeOut(1000, redirectPage);
});

function selectFrench() {
	$('[lang="en"]').hide();
	$('[lang="fr"]').show();
}
function selectEnglish() {
	$('[lang="en"]').show();
	$('[lang="fr"]').hide();
}
	  
function redirectPage() {
	window.location = linkLocation;
}

var currentItem;
var showingModal;
document.onkeydown = checkKey;
function checkKey(e) {
	e = e || window.event;
	if (e.keyCode == '37') {
	   // left arrow 
	   openLeftModal();
	}
	else if (e.keyCode == '39') {
	   // right arrow
	   openRightModal();	   
	}
}

function openLeftModal() {
	if (currentItem <= 0 || !showingModal)
		return;
	$("#" + currentItem).modal('hide');
	currentItem--;
	setTimeout(openModal, 500);
	return false;
}	
function openRightModal() {
	if (!showingModal)
		return;
	$("#" + currentItem).modal('hide');
	currentItem++;
	setTimeout(openModal, 500);
	return false;
}	

function openModal() {
	$("#" + currentItem).modal('show');
	return false;
}	
function saveItem(obj) {
	showingModal = true;
	currentItem = obj.getAttribute("href").replace('#','');
	return false;
}
function closeModal() {
	showingModal = false;
	return false;
}