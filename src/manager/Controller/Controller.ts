import {TEventMap} from './types';
import {getNextIndex, getPrevIndex, getSlideIndex} from './utils';

import Configurator from '../Configurator';
import Stater from '../Stater';
import Locator from '../Locator';
import Elementor from '../Elementor';
import SyncCarousel from '../SyncCarousel';
import Eventor from '../Eventor';


class Controller {
    private readonly _configurator: Configurator;
    private readonly _stater: Stater;
    private readonly _locator: Locator;
    private readonly _elementor: Elementor;
    private readonly _syncCarousel: SyncCarousel;
    private _eventor = new Eventor<TEventMap>();

    constructor(manager: {
        configurator: Configurator,
        stater: Stater,
        locator: Locator,
        elementor: Elementor,
        syncCarousel: SyncCarousel,
    }) {
        this._configurator = manager.configurator;
        this._stater = manager.stater;
        this._locator = manager.locator;
        this._elementor = manager.elementor;
        this._syncCarousel = manager.syncCarousel;
    }

    onSlideBefore = (callback: TEventMap['slideBefore']) => {
        this._eventor.on('slideBefore', callback);

    };

    onSlideAfter = (callback: TEventMap['slideAfter']) => {
        this._eventor.on('slideAfter', callback);
    };

    offSlideBefore = () => {
        this._eventor.off('slideBefore');
    };

    offSlideAfter = () => {
        this._eventor.off('slideAfter');
    };


    /**
     * reset page position (Only LoopMode)
     * PS: If the element is isClone then return to the position where it should actually be displayed
     */
    slideResetToMatchIndex = (): void => {
        // if(this.props.isDebug && logEnable.resetPosition) log.printInText('[_resetPosition]');
        const {actual, formatElement} = this._stater;

        if (formatElement[actual.activeIndex].isClone) {
            this.slideToActualIndex(formatElement[actual.activeIndex].matchIndex, false);
        }
    };

    slideToActualIndex = (slideIndex: number, isUseAnimation = true) => {
        this._eventor.emit('slideBefore');

        if (this._stater.checkActualIndexInRange(slideIndex)) {
            const {formatElement} = this._stater;
            this._stater.setActiveActual(slideIndex, formatElement[slideIndex]?.inPage ?? 1);

            // 移動EL位置
            const position = this._elementor.getMoveDistance(slideIndex);
            this._elementor
                .transform(position, isUseAnimation)
                .syncActiveState(slideIndex);

            this._syncCarousel.slideToActualIndex(slideIndex, isUseAnimation);
        }
        this._eventor.emit('slideAfter');

    };

    /**
     * 移動到指定頁面
     * @param page
     * @param isUseAnimation 是否開啟動畫
     * ex: slideView: 2, slideGroup: 2, total: 4
     * page1 -> (1-1) * 2) + 1 + (firstIndex -1) = 1
     */
    slideToPage(page: number, isUseAnimation = true){
        const {setting} = this._configurator;
        const {actual} = this._stater;

        page = page > this._stater.page.pageTotal ? this._stater.page.pageTotal: page;

        const slideIndex = getSlideIndex(page, setting.slidesPerGroup, actual.firstIndex);
        this.slideToActualIndex(slideIndex, isUseAnimation);
    }

    /**
     * 移動到下一頁
     */
    slideToNextPage = (): void => {

        const {nextPage, formatElement, page, actual, residue, element, nextPageFirstIndex} = this._stater;
        const {setting} = this._configurator;
        const activeActual = formatElement[actual.activeIndex];

        getNextIndex(
            activeActual,
            {
                nextPage: nextPage,
                residue: residue,
                pageTotal: page.pageTotal,
                slideTotal: this._stater.formatElement.length,
                isOverflowPage: nextPage > page.pageTotal,
                isOverflowIndex: nextPageFirstIndex > element.lastIndex,
            },
            {
                slidesPerGroup: setting.slidesPerGroup,
                slidesPerViewActual: setting.slidesPerViewActual,
                isLoopMode: setting.isEnableLoop,
            }
        )
            .forEach(action => this.slideToActualIndex(action.index, action.isUseAnimation));

    };

    /**
     * go to previous
     */
    slideToPrevPage = (): void => {

        const {nextPage, formatElement, page, actual, residue, element, nextPageFirstIndex} = this._stater;
        const {setting} = this._configurator;
        const activeActual = formatElement[actual.activeIndex];

        getPrevIndex(
            activeActual,
            {
                activePage: this._stater.page.activePage,
                residue: residue,
                pageTotal: page.pageTotal,
                slideTotal: this._stater.formatElement.length,
                isOverflowPage: nextPage > page.pageTotal,
                isOverflowIndex: nextPageFirstIndex > element.lastIndex,
            },
            {
                slidesPerGroup: setting.slidesPerGroup,
                slidesPerViewActual: setting.slidesPerViewActual,
                isLoopMode: setting.isEnableLoop,
            }
        )
            .forEach(action => this.slideToActualIndex(action.index, action.isUseAnimation));

    };

}


export default Controller;