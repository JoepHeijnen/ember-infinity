import Ember from 'ember';

const InfinityLoaderComponent = Ember.Component.extend({
  classNames: ["infinity-loader"],
  classNameBindings: ["infinityModel.reachedInfinity"],
  guid: null,
  eventDebounce: 10,
  loadMoreAction: 'infinityLoad',
  loadingText: 'Loading Infinite Model...',
  loadedText: 'Infinite Model Entirely Loaded.',
  destroyOnInfinity: false,
  developmentMode: false,
  scrollable: null,
  triggerOffset: 0,
  reverse: false,

  didInsertElement(){
    Ember.run.schedule('routerTransitions', this, ()  =>  this.setupElement());
  },

  setupElement() {
    this._super(...arguments);
    this._setupScrollable();
    this.set('guid', Ember.guidFor(this));
    this._bindEvent('scroll');
    this._bindEvent('resize');
    this._loadMoreIfNeeded();
  },

  willDestroyElement() {
    this._super(...arguments);
    this._unbindEvent('scroll');
    this._unbindEvent('resize');
  },

  _bindEvent(eventName) {
    this.get('_scrollable').on(`${eventName}.${this.get('guid')}`, () => {
      Ember.run.debounce(this, this._loadMoreIfNeeded, this.get('eventDebounce'));
    });
  },

  _unbindEvent(eventName) {
    let scrollable = this.get('_scrollable');
    if (scrollable) {
      scrollable.off(`${eventName}.${this.get('guid')}`);
    }
  },

  _selfOffset() {
    if (this.get('_customScrollableIsDefined')) {
      return this.$().offset().top - this.get("_scrollable").offset().top + this.get("_scrollable").scrollTop();
    } else {
      return this.$().offset().top;
    }
  },

  _bottomOfScrollableOffset() {
    return this.get('_scrollable').height() + this.get("_scrollable").scrollTop();
  },

  _triggerOffset() {
    return this._selfOffset() - this.get('triggerOffset');
  },

  _shouldLoadMore() {
    if (this.get('developmentMode') || typeof FastBoot !== 'undefined' || this.isDestroying || this.isDestroyed) {
      return false;
    }

    if (this.get('reverse')) {
      return this.get("_scrollable").scrollTop() <= this.get('triggerOffset');
    } else {
      return this._bottomOfScrollableOffset() > this._triggerOffset();
    }
  },

  _loadMoreIfNeeded() {
    if (this._shouldLoadMore()) {
      this.sendAction('loadMoreAction', this.get('infinityModel'));
    }
  },

  _contentScrollDown() {
    let scrollable = this.get("_scrollable");
    scrollable.scrollTop(scrollable[0].scrollHeight);
  },

  _setupScrollable() {
    var scrollable = this.get('scrollable');
    if (Ember.typeOf(scrollable) === 'string') {
      var items = Ember.$(scrollable);
      if (items.length === 1) {
        this.set('_scrollable', items.eq(0));
      } else if (items.length > 1) {
        throw new Ember.Error("Ember Infinity: Multiple scrollable elements found for: " + scrollable);
      } else {
        throw new Ember.Error("Ember Infinity: No scrollable element found for: " + scrollable);
      }
      this.set('_customScrollableIsDefined', true);
    } else if (scrollable === undefined || scrollable === null) {
      this.set('_scrollable', Ember.$(window));
      this.set('_customScrollableIsDefined', false);
    } else {
      throw new Ember.Error("Ember Infinity: Scrollable must either be a css selector string or left empty to default to window");
    }
  },

  loadedStatusDidChange: Ember.observer('infinityModel.reachedInfinity', 'destroyOnInfinity', function () {
    if (this.get('infinityModel.reachedInfinity') && this.get('destroyOnInfinity')) {
      this.destroy();
    }
  }),

  infinityModelPushed: Ember.observer('infinityModel.length', function() {
    if (this.get('reverse')) {
      Ember.run.scheduleOnce('afterRender', this, this._loadMoreIfNeeded);
      this.get("_scrollable").scrollTop(100);
    } else {
      Ember.run.scheduleOnce('afterRender', this, this._loadMoreIfNeeded);
    }
  })
});

export default InfinityLoaderComponent;
