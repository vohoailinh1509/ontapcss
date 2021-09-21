$(function(){
	$('[data-start-at]').each(function(){
		var e=$(this);
		e.css('counter-set',e.css('counter-reset')+(e.attr('data-start-at')-1));
	});	
	var observer = new IntersectionObserver(headingScrolled, {
		root: null,
		rootMargin: '-45% 0px -45% 0px'
		});
	if($('#main-heading').data('start-at')){
		$('#nav-main').attr('data-start-at',$('#main-heading').data('start-at'));
	}
	$('#nav-main').addClass('heading');
	$('#main-heading>li').each(function(i){
		$('#nav-main').append(createMenuItem($(this),(i+1),1));
	});
	$('#main-heading>li, #main-heading ul.heading>li').each(function(i){
		observer.observe(this);
	});
	
	$('#nav-main').on('click','.nav-link',function(event){
		event.preventDefault();
		goToSection(this.hash);
	});
	$('#my-breadcrumb').on('click','a',function(event){
		event.preventDefault();
		goToSection(this.hash);
	});	
	$('.content').on('click','.card-title',function(){
		$(this).closest('.card').CardWidget('toggle');
	});
	$('.content').on('click','.btn-apply',function(){
		updateCode($(this).closest('.code-group'));
	});
	$('.content').on('click','.btn-reset',function(){
		resetCode($(this).closest('.card').find('.txt-original'));
	});
	$('.content').on('click','.btn-copy',function(){
		copyCode($(this).closest('.card').find('.txt-original'));
	});
	$('.content').on('click','.card-header',function(){
		var txt=$(this).closest('.card').find('.txt-original');
		if(txt.length==1){txt.data('editor').focus();};
	});
	with (CodeMirror.defaults){
		theme='mdn-like';
		scrollbarStyle:'simple';
		tabSize=3;
		indentUnit=3;
		indentWithTabs=true;
		lineNumbers=true;
		lineWrapping=true;
		foldGutter=true;
		gutters=["CodeMirror-linenumbers", "CodeMirror-foldgutter"];
		matchBrackets=true;
		autoCloseBrackets =true;
		matchTags =true;
		autoCloseTags =true;
		resetSelectionOnContextMenu=false;
		pollInterval=10000;
		workTime=100;
		workDelay=500;
	}
	$('a[href^="http"]').each(function(){
		this.target="_blank";
		var a=$(this);
		if(a.find('img').length==0){
			a.append('<i class="fas fa-external-link-alt text-xs"></i>');
		}
	});
});

function goToSection(id){
	var li=$(id).closest('li');
	li.find('.card').first().parents('.card').addBack().each(function(){
		$(this).CardWidget('expand');
	});
	activate(li);
	setTimeout(function(id){$(id)[0].scrollIntoView()},400,id);
}
function initCode(group){
	group.find('.code-highlight').each(function(){
		var ele=$(this);
		var html='';
		if(ele.children().first().prop('tagName')==="SCRIPT"){
			html=ele.children().first().html().replace(/tmpscript/g,'script').replace(/&#47;/g,'/');
		}
		else{
			html=ele.html();
		}
		html=html.trim();
		var language=
		(ele.hasClass('language-css')?'css'
			:(ele.hasClass('language-javascript')?'javascript'
			:(ele.hasClass('language-html')?'htmlmixed':null)));
			var title=language.replace('mixed','');
			var txt=$('<textarea></textarea>').addClass('txt-original');
			txt[0].textContent=html;
			var card=$($('#card-code').html()).removeAttr('id').addClass('card-'+title);
			card.find('.card-title').html(title);
			group.append(card);
			card.find('.card-body').append(txt);
			card.addClass(ele.attr('class'));
			var cm=CodeMirror.fromTextArea(txt[0],{
				mode:  language,
				lineNumbers: ele.hasClass('line-numbers')
			});
			if(!ele.hasClass('no-auto-indent')){
				cm.execCommand('selectAll');
				cm.execCommand('indentAuto');
				cm.execCommand('goDocStart');
				cm.execCommand('save');
			}
			txt.data('editor',cm);
			txt.data('reload',cm.getValue());
			ele.remove();
	});
	updateCode(group);
}
function resetCode(txt){
	var cm=txt.data('editor');
	var c=cm.doc.getCursor();
	cm.setValue(txt.data('reload'));
	cm.execCommand('selectAll');
	cm.execCommand('indentAuto');
	cm.doc.setCursor(c);
	
}
function copyCode(txt){
	var cm=txt.data('editor');
	copyToClipboard(cm.getValue());
	//cm.focus();
}
function updateCode(group){
	var content=group.find('.keep-content .txt-original');
	if(content.length==0){return};
	group.find('.card-result').remove();
	var frame=$('<iframe></iframe>').addClass('code-result');		
		var newDoctype = document.implementation.createDocumentType('html','','');		
		var card=$($('#card-code').html()).removeAttr('id').addClass('card-result');
		card.find('.card-title').html('Result');
		card.find('.card-header :is(.btn-apply,.btn-copy,.btn-reset)').remove();
		group.append(card);
		card.find('.card-body').append(frame);
		frame[0].contentDocument.insertBefore(newDoctype,frame[0].contentDocument.childNodes[0]);
	frame.contents().find('body').html(content.data('editor').getValue());
	var css=group.find('.language-css');
	if(css.length){
		frame.contents().find('head').html('<style>'+css.find('.txt-original').data('editor').getValue()+'</style>');
	}
	var js=group.find('.language-javascript');
	if(js.length){
		if(js.hasClass('jquery')){
			frame.contents().find('body').append('<script>if (typeof(jQuery) == "undefined") {window.jQuery = function (selector) { return parent.jQuery(selector, document); }; jQuery = parent.$.extend(jQuery, parent.$);window.$ = jQuery;}<\/script>');
		}
		frame.contents().find('body').append('<script>'+js.find('.txt-original').data('editor').getValue()+'<\/script>');
	}
	frame.height(frame.contents().height());
}

function copyToClipboard(text) {
	if (window.clipboardData && window.clipboardData.setData) {
		// IE specific code path to prevent textarea being shown while dialog is visible.
		return clipboardData.setData("Text", text);
		
		} else if (document.queryCommandSupported && document.queryCommandSupported("copy")) {
		var textarea = document.createElement("textarea");
		textarea.textContent = text;
		textarea.style.position = "fixed";  // Prevent scrolling to bottom of page in MS Edge.
		document.body.appendChild(textarea);
		textarea.select();
		try {
			return document.execCommand("copy");  // Security exception may be thrown by some browsers.
			} catch (ex) {
			console.warn("Copy to clipboard failed.", ex);
			return false;
			} finally {
			document.body.removeChild(textarea);
		}
	}
}

function createMenuItem(li,id,level){
	id=id+'-';
	var item=$(li[0].cloneNode(false));
	var txt=li[0].firstElementChild.innerHTML;
	li[0].firstElementChild.remove();
	var s=id+txt.replace(/\W/g,'-');
	var hack=$('<span></span>').addClass('scroll-hack').attr('id',s);
	var p=$('<p></>').addClass('heading-number').html(txt);
	var a=$('<a></a>').addClass('nav-link').attr('href','#'+s).append(p);
	item.append(a);
	item.addClass('nav-item');
	if(li.children('.heading').length==1){
		//item.addClass('menu-open');
		//a.append('<i class="right fas fa-angle-left"></i>');
		//var ul=$('<ul></ul>').addClass('heading nav nav-treeview');
		var ul=$('<ul></ul>').addClass('heading nav nav-pills nav-sidebar nav-compact nav-child-indent flex-column');
		li.children('.heading').first().children('li').each(function(i){
			ul.append(createMenuItem($(this),id+(i+1),level+1));
		});
		item.append(ul);
	}
	
	var card=$($('#card-text').html()).removeAttr('id');
	var tag=level<=6?('h'+level):'p';
	var title=card.find('.card-title')[0].cloneNode(false).outerHTML;
	title=title.replace(/(^<\S+)|(\/\S+>$)/,'<'+tag);
	title=$(title);
	title.html(txt).addClass('heading-number');
	card.find('.card-title').replaceWith(title);
	card[0].tagName=tag;
	card.find('.card-body').append(li.children());
	
	li.append(card);
	li.prepend(hack);
	li.data('menu-item',item);
	item.data('menu-item',li);
	return item;
}
function headingScrolled(entries, observer){
	if(entries.length==1&&!entries[0].isIntersecting){
		activate(entries[0].target,false);
		return;
	}
	for(var i=entries.length-1;i>=0;i--){
		if(entries[i].isIntersecting){
			activate(entries[i].target);
			break;
		}
	}
	// Each entry describes an intersection change for one observed
	// target element:
	//   entry.boundingClientRect
	//   entry.intersectionRatio
	//   entry.intersectionRect
	//   entry.isIntersecting
	//   entry.rootBounds
	//   entry.target
	//   entry.time
	
}
function activate(e, active=true){
	var li=$(e);
	if(!active){
		if(li.hasClass('current')){
			li=li.parent().closest('li');
			if(li.length==0){return;}
		}
		else{return;}
	}
	$('#main-heading li.current').removeClass('current');
	li.addClass('current');
	
	var title=li.find('.heading-number');
	var item=li.data('menu-item');
	var bc=$('#my-breadcrumb');
	bc.html($('<li></li>').html(title.html()));
	li.parents('li').each(function(){
		var link=$(this).data('menu-item').children('.nav-link').first();
		var a=$('<a></a>').attr('href',link.attr('href')).html($('<span></sapn>').html(link.children('.heading-number').html()));
		bc.prepend($('<li></li>').html(a));
	});
	
	if(!li.data('code-loaded')){
		li.data('code-loaded',true);
		li.find('.code-group').each(function(){
		console.log($(this).closest('.heading li')[0]);
			if(!($(this).closest('.heading>li').hasClass('current'))){return;}
			var x=window.scrollX;
			var y=window.scrollY;
			initCode($(this));
			window.scrollTo(x, y);
		});
	}
	
	$('#nav-main').find('.active').removeClass('active');
	if(item.find('ul').length>0){return;}
	item.find('.nav-link').addClass('active');
}