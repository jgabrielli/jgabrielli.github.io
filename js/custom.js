/* Custom scrips for my portfolio - Jonathan Gabrielli 2016-2017*/

$(document).ready(function() {
	$("body").css("display", "none");
});
$(function(){
	$("#header").load("header.html"); 
	$("#footer").load("footer.html"); 
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
	if (currentItem <= 1 || !showingModal)
			return;
	$("#" + currentItem).modal('hide');
	currentItem--;
	setTimeout(openModal, 500);
	return false;
}	
function openRightModal() {
	if (currentItem >= 17 || !showingModal)
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