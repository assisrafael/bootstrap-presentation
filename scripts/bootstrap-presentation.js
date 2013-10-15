(function ($) {
	var onFullScreen = typeof onFullScreenCallback == "undefined" ? function() {} : onFullScreenCallback;
	
	var Presentation = function(element, options) {
		this.options = options;
		this.$element = $(element);
		this.prepareSlides();
		this.addFooter();
		this.addSidebar();
		var $this = this;
		$('body').keyup(function(event) {
			$this.keyboardAction(event.keyCode);
		});
		this.prepareFullScreen();
		this.prepareConfigModal();
		this.continueInLastSlide();
	}
	
	var prefixNumberWithZeros = function (num, total) {
		var prefix = '';
		var strNum = ''+num;
		var strTotal = ''+total;
		var missingZeros = strTotal.length-strNum.length;
		for(var i=0; i<missingZeros; i++)
			prefix +='0';
		return prefix+num;
	}
	
	Presentation.prototype = {
		constructor: Presentation,
		prepareSlides: function() {
			var slides = []
			this.$element.children('article').each(function(){
				var $this = $(this);
				$this.hide();
				slides.push({
					title: $this.children('header').html(),
					$holder: $this,
					$body: $this.children('section'),
				});
			});
			
			this.presentationTitle = slides[0].title;
			this.slides = slides;
		},
		footerTemplate: function($pageIndex, $totalPages) {
			return '<footer> \
						<div class="row-fluid"> \
							<div class="span8 offset2">'+this.presentationTitle+'</div> \
							<div class="span2">'+prefixNumberWithZeros($pageIndex,$totalPages)+'/'+$totalPages+'</div> \
						</div> \
					</footer>';
		},
		addFooter: function(){
			for(var i=0; i<this.slides.length; i++) {
				this.slides[i].$holder.append(this.footerTemplate((i+1),this.slides.length));
			}
		},
		addSidebar: function() {
			if(this.options.sidebar) {
				this.$element.before('<div class="span3 sidebar"></div>');
				this.$sidebar = $('div.sidebar');
				this.$element.addClass('span9');
				this.addToolbar();
				this.navigation();
				this.$sidebar
					.delegate('[data-ptt-action="config"]', 'click.action.presentation', $.proxy(this.openConfigurations, this))
					.delegate('[data-ptt-action="fullscreen"]', 'click.action.presentation', $.proxy(this.openFullScreen, this))
					.delegate('[data-ptt-action="last"]', 'click.action.presentation', $.proxy(this.last, this))
					.delegate('[data-ptt-action="next"]', 'click.action.presentation', $.proxy(this.next, this))
					.delegate('[data-ptt-action="previous"]', 'click.action.presentation', $.proxy(this.previous, this))
					.delegate('[data-ptt-action="first"]', 'click.action.presentation', $.proxy(this.first, this))
					.delegate('[data-ptt-jump]', 'click.jump.presentation', $.proxy(this.jump, this));
			}
		},
		prepareConfigModal: function() {
			var btnOn = this.options.sidebar ? ' active' : '';
			var btnOff = !this.options.sidebar ? ' active' : '';
			var selected34 = this.options.ratio == '4:3' ? 'selected' : '';
			var selected169 = this.options.ratio == '16:9' ? 'selected' : '';;
			var screenOptions = 
				'<select id="screen-ratio-option"> \
					<option value="4:3" '+selected34+'>4:3</option>\
					<option value="16:9" '+selected169+'>16:9</option>\
				</select>';
			var configTemplate = 
				'<div id="configs" class="modal hide" role="dialog"> \
					<div class="modal-header"> \
						<button type="button" class="close" data-dismiss="modal" aria-hidden="true">×</button> \
						<h3 id="myModalLabel">'+'Configurations'+'</h3> \
					</div> \
					<div class="modal-body">\
						Sidebar: <br />\
						<div id="sidebar-option" class="btn-group" data-toggle="buttons-radio"> \
							<button class="btn'+btnOn+'">On</button>\
							<button class="btn'+btnOff+'">Off</button>\
						</div><br />\
						Screen ration: <br />\
						'+screenOptions+'<br />\
					</div> \
					<div class="modal-footer"> \
						<button class="btn" data-dismiss="modal" aria-hidden="true">'+'Close'+'</button>\
						<button class="btn btn-primary save" data-dismiss="modal">'+'Apply'+'</button>\
					</div> \
				</div>';
			this.configHolder = $(configTemplate);
			var $this = this;
			this.configHolder.find('button.save').click(function(){
				$this.updateConfigurations();
			});
		},
		openConfigurations: function() {
			this.configHolder.modal('show');
		},
		updateConfigurations: function() {
			console.log('Update configurations');
//			this.options.sidebar = this.configHolder.find('#sidebar-option button.active').html();
			this.options.ratio = this.configHolder.find('#screen-ratio-option').val();
			this.continueInLastSlide();
		},
		navigation: function() {
			var navList = '<div class="sidebar-nav"><ul class="nav nav-list">';
			for(var i=0; i<this.slides.length; i++) {
				var title = this.slides[i].title;
				navList += '<li class=""><a href="#'+(i+1)+'" data-ptt-jump="'+i+'"><i class="icon-chevron-right"></i>'+prefixNumberWithZeros(i+1,this.slides.length)+': '+title+'</a></li>';
			}
			navList += '</ul></div>';
			
			this.$sidebar.append(navList);
			var actualItem = '';
			this.selectToolbarItem = function(nextItem){
				if(actualItem)
					actualItem.removeClass('active');
				actualItem = nextItem.parent();
				actualItem.addClass('active');
			};
			var $this = this;
			$(".sidebar-nav > ul > li > a").on('click', function(){
				$this.selectToolbarItem($(this));
			})
		},
		selectToolbarItem: function(){ },
		addToolbar: function() {
			this.$sidebar.append(
				'<div class="ptt-toolbar"> \
					<div class="btn-toolbar"> \
						<div class="btn-group"> \
							<button class="btn" data-ptt-action="fullscreen" title="F8"><i class="icon-fullscreen" ></i></button> \
							<button class="btn" data-ptt-action="config"><i class="icon-wrench"></i></button> \
						</div> \
						<div class="btn-group"> \
							<button class="btn" data-ptt-action="first" rel="tooltip" title="up"><i class="icon-step-backward"></i></button> \
							<button class="btn" data-ptt-action="previous" rel="tooltip" title="left"><i class="icon-chevron-left"></i></button> \
							<button class="btn" data-ptt-action="next" rel="tooltip" title="right"><i class="icon-chevron-right"></i></button> \
							<button class="btn" data-ptt-action="last" rel="tooltip" title="down"><i class="icon-step-forward"></i></button> \
						</div> \
						<div class="btn-group"> \
							<button class="btn btn-info disabled" id="ptt-counter"></button> \
						</div> \
					</div> \
				</div>');

			this.counter = $('#ptt-counter');
		},
		adjustScreen: function(slideContainer) {
			var heightFactor = 1;
			switch(this.options.ratio) {
				case '4:3':
					heightFactor = 3/4;
					break;
				case '16:9': 
					heightFactor = 9/16;
					break;
			}
			
			var totalwidth = slideContainer.outerWidth();
			var totalHeight = heightFactor*totalwidth;
			slideContainer.height(totalHeight+"px");
		},
		prepareFullScreen: function() {
			this.fullScreenContainer = $("<div class='ptt-fullscreen modal hide'></div>");
			this.isFullScreen = false;
			var $this = this;
			this.fullScreenContainer.click(function(){
				$this.fullScreenContainer.html($this.slides[$this.actualSlide].$holder.clone(true));
				$this.adjustScreen($this.fullScreenContainer.children('article'));
			});
			var actualOverflow = $('body').css('overflow');
			this.fullScreenContainer.on('hidden',function(){
				$('body').css('overflow', actualOverflow);
			});
			this.fullScreenContainer.on('shown',function(){
				$('body').css('overflow', 'hidden');
			});
		},
		openFullScreen: function() {
			this.isFullScreen = true;
			this.fullScreenContainer.modal('show');
			this.showSlide(this.actualSlide);
		},
		closeFullScreen: function(){
			if(this.fullScreenContainer){
				this.fullScreenContainer.modal('hide');
			}
			this.isFullScreen = false;
		},
		showSlide: function(i) {
			if(i < 0)
				i = 0;
			else if (i >= this.slides.length)
				i = this.slides.length - 1;
			
			this.slides[this.actualSlide].$holder.hide();
			this.actualSlide = i;
			var currentSlide = this.slides[this.actualSlide];
			
			currentSlide.$holder.show();
			if(this.isFullScreen){
				this.fullScreenContainer.html(currentSlide.$holder.clone(true));
				this.adjustScreen(this.fullScreenContainer.children('article'));
				onFullScreen(currentSlide.$body);
			}
			this.adjustScreen(currentSlide.$holder);
			if(this.options.sidebar)
				this.counter.html(" "+prefixNumberWithZeros(this.actualSlide+1,this.slides.length)+"/"+this.slides.length);
			location.hash = i+1;
			this.selectToolbarItem($('.sidebar-nav > ul > li > a[href=#'+(i+1)+']'));
		},
		continueInLastSlide: function() {
			this.actualSlide = 0;
			var slide = location.hash.slice(1);

			if(slide)
				slide = parseInt(slide)-1;
			else
				slide = 0;

			this.showSlide(slide);
		},
		next: function() {
			this.showSlide(this.actualSlide+1);
		},
		previous: function() {
			this.showSlide(this.actualSlide-1);
		},
		first: function() {
			this.showSlide(0);
		},
		last: function() {
			this.showSlide(this.slides.length-1);
		},
		jump: function(event) {
			var index = $(event.currentTarget).data('ptt-jump');
			this.showSlide(index);
		},
		keyboardAction: function(key) {
//			console.log(key);
			switch(key) {
				case 27: //ESC
					this.closeFullScreen();
					break;
				case 33:
				case 37: //left
					this.previous();
					break;
				case 38: //up
					this.first();
					break;
				case 34:
				case 39: //right
					this.next();
					break;
				case 40: //down
					this.last();
					break;
				case 66:
				case 119: //F8
					if(this.isFullScreen)
						this.closeFullScreen();
					else
						this.openFullScreen();
					break;
			}
		}
	}
	
	/* PRESENTATION PLUGIN DEFINITION
	* ================================ */
	$.fn.presentation = function (option) {
		return this.each(function () {
			var $this = $(this),
				data = $this.data('presentation'),
				options = $.extend({}, $.fn.presentation.defaults, $this.data(), typeof option == 'object' && option);
			if(!data) $this.data('presentation', (data = new Presentation(this,options)));
		});
	};
	
	$.fn.presentation.defaults = {
		ratio: '4:3',
		sidebar: true,
	}
	
	$.fn.presentation.Constructor = Presentation;
	
	/* PRESENTATION DATA-API
	 */
	$(window).on('load', function () {
		$('#presentation').each(function(){
			var $slides = $(this),
				option = $.extend({ }, $slides.data())
				
			$slides.presentation(option);
		});
	});
})(jQuery);
