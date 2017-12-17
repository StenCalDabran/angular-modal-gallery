/*
 The MIT License (MIT)

 Copyright (c) 2017 Stefano Cappa (Ks89)

 Permission is hereby granted, free of charge, to any person obtaining a copy
 of this software and associated documentation files (the "Software"), to deal
 in the Software without restriction, including without limitation the rights
 to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 copies of the Software, and to permit persons to whom the Software is
 furnished to do so, subject to the following conditions:

 The above copyright notice and this permission notice shall be included in all
 copies or substantial portions of the Software.

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 FITNESS FOR A PARTICULAR PURPOSE AND NON INFRINGEMENT. IN NO EVENT SHALL THE
 AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 SOFTWARE.
 */

import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

import {
  ButtonConfig,
  ButtonEvent,
  ButtonsConfig,
  ButtonsStrategy,
  ButtonType,
  WHITELIST_BUTTON_TYPES
} from '../../interfaces/buttons-config.interface';
import { Image } from '../../interfaces/image.class';
import { AccessibleComponent } from '../accessible.component';
import { NEXT } from '../../utils/user-input.util';
import { Action } from '../../interfaces/action.enum';
import { Size } from '../../interfaces/size.interface';

export interface InternalButtonConfig extends ButtonConfig {
  id?: number; // useful only for trackById, not needed by users
}

/**
 * Component with all upper buttons.
 * Also it emits click events as outputs.
 */
@Component({
  selector: 'ks-upper-buttons',
  styleUrls: ['upper-buttons.scss'],
  templateUrl: 'upper-buttons.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UpperButtonsComponent extends AccessibleComponent implements OnInit {

  /**
   * Input of type `Image` that represent the visible image.
   */
  @Input() currentImage: Image;
  /**
   * Input of type `ButtonsConfig` to init UpperButtonsComponent's features.
   * For instance, it contains an array of buttons.
   */
  @Input() buttonsConfig: ButtonsConfig;

  /**
   * Output to emit clicks on refresh button. The payload contains a `ButtonEvent`.
   */
  @Output() refresh: EventEmitter<ButtonEvent> = new EventEmitter<ButtonEvent>();
  /**
   * Output to emit clicks on delete button. The payload contains a `ButtonEvent`.
   */
  @Output() delete: EventEmitter<ButtonEvent> = new EventEmitter<ButtonEvent>();
  /**
   * Output to emit clicks on navigate button. The payload contains a `ButtonEvent`.
   */
  @Output() navigate: EventEmitter<ButtonEvent> = new EventEmitter<ButtonEvent>();
  /**
   * Output to emit clicks on download button. The payload contains a `ButtonEvent`.
   */
  @Output() download: EventEmitter<ButtonEvent> = new EventEmitter<ButtonEvent>();
  /**
   * Output to emit clicks on close button. The payload contains a `ButtonEvent`.
   */
  @Output() close: EventEmitter<ButtonEvent> = new EventEmitter<ButtonEvent>();
  /**
   * Output to emit clicks on all custom buttons. The payload contains a `ButtonEvent`.
   */
  @Output() customEmit: EventEmitter<ButtonEvent> = new EventEmitter<ButtonEvent>();

  /**
   * Input of type Array of `InternalButtonConfig` exposed to the template. This field is initialized
   * applying transformations, default values and so on to the input of the same type.
   */
  buttons: InternalButtonConfig[];
  /**
   * Object of type `ButtonsConfig` exposed to the template. This field is initialized
   * applying transformations, default values and so on to the input of the same type.
   */
  configButtons: ButtonsConfig;

  /**
   * Default button size object
   * @type ButtonSize
   */
  private defaultSize: Size = {height: 'auto', width: '30px'};

  /**
   * Default buttons array for standard configuration
   * @type ButtonConfig[]
   */
  private defaultButtonsDefault: ButtonConfig[] = [{
    className: 'close-image',
    size: this.defaultSize,
    type: ButtonType.CLOSE,
    title: 'Close this modal image gallery',
    ariaLabel: 'Close this modal image gallery'
  }];

  /**
   * Default buttons array for simple configuration
   * @type ButtonConfig[]
   */
  private simpleButtonsDefault: ButtonConfig[] = [
    {
      className: 'download-image',
      size: this.defaultSize,
      type: ButtonType.DOWNLOAD,
      title: 'Download the current image',
      ariaLabel: 'Download the current image'
    },
    ...this.defaultButtonsDefault
  ];

  /**
   * Default buttons array for advanced configuration
   * @type ButtonConfig[]
   */
  private advancedButtonsDefault: ButtonConfig[] = [
    {
      className: 'ext-url-image',
      size: this.defaultSize,
      type: ButtonType.EXTURL,
      title: 'Navigate the current image',
      ariaLabel: 'Navigate the current image'
    },
    ...this.simpleButtonsDefault
  ];

  /**
   * Default buttons array for full configuration
   * @type ButtonConfig[]
   */
  private fullButtonsDefault: ButtonConfig[] = [
    {
      className: 'refresh-image',
      size: this.defaultSize,
      type: ButtonType.REFRESH,
      title: 'Refresh all images',
      ariaLabel: 'Refresh all images'
    },
    {
      className: 'delete-image',
      size: this.defaultSize,
      type: ButtonType.DELETE,
      title: 'Delete the current image',
      ariaLabel: 'Delete the current image'
    },
    ...this.advancedButtonsDefault
  ];

  /**
   * Method ´ngOnInit´ to build `configButtons` applying a default value and also to
   * init the `buttons` array.
   * This is an Angular's lifecycle hook, so its called automatically by Angular itself.
   * In particular, it's called only one time!!!
   */
  ngOnInit() {
    const defaultConfig: ButtonsConfig = {visible: true, strategy: ButtonsStrategy.DEFAULT};
    this.configButtons = Object.assign(defaultConfig, this.buttonsConfig);

    switch (this.configButtons.strategy) {
      case ButtonsStrategy.SIMPLE:
        this.buttons = this.addButtonIds(this.simpleButtonsDefault);
        break;
      case ButtonsStrategy.ADVANCED:
        this.buttons = this.addButtonIds(this.advancedButtonsDefault);
        break;
      case ButtonsStrategy.FULL:
        this.buttons = this.addButtonIds(this.fullButtonsDefault);
        break;
      case ButtonsStrategy.CUSTOM:
        this.buttons = this.addButtonIds(this.validateCustomButtons(this.configButtons.buttons));
        break;
      case ButtonsStrategy.DEFAULT:
      default:
        this.buttons = this.addButtonIds(this.defaultButtonsDefault);
        break;
    }
  }

  /**
   * Method called by events from both keyboard and mouse on a button.
   * This will call a private method to trigger an output with the right payload.
   * @param {InternalButtonConfig} button that called this method
   * @param {number} index of the button that called this method
   * @param {KeyboardEvent | MouseEvent} event payload
   * @param {Action} action that triggered the source event or `Action.CLICK` if not specified
   */
  onEvent(button: InternalButtonConfig, index: number, event: KeyboardEvent | MouseEvent, action: Action = Action.CLICK) {
    if (!event) {
      return;
    }
    const dataToEmit: ButtonEvent = {
      buttonIndex: index,
      button: button,
      // current image initialized as null
      // (I'll fill this value inside the parent of this component
      image: null,
      action: action
    };
    switch (button.type) {
      case ButtonType.REFRESH:
        this.triggerOnMouseAndKeyboard(this.refresh, event, dataToEmit);
        break;
      case ButtonType.DELETE:
        this.triggerOnMouseAndKeyboard(this.delete, event, dataToEmit);
        break;
      case ButtonType.EXTURL:
        if (!this.currentImage || !this.currentImage.modal || !this.currentImage.modal.extUrl) {
          return;
        }
        this.triggerOnMouseAndKeyboard(this.navigate, event, dataToEmit);
        break;
      case ButtonType.DOWNLOAD:
        this.triggerOnMouseAndKeyboard(this.download, event, dataToEmit);
        break;
      case ButtonType.CLOSE:
        this.triggerOnMouseAndKeyboard(this.close, event, dataToEmit);
        break;
      case ButtonType.CUSTOM:
        this.triggerOnMouseAndKeyboard(this.customEmit, event, dataToEmit);
        break;
      default:
        throw new Error(`Unknown button's type into ButtonConfig`);
    }
  }

  /**
   * Method used in the template to track ids in ngFor.
   * @param {number} index of the array
   * @param {Image} item of the array
   * @returns {number} the id of the item
   */
  trackById(index: number, item: InternalButtonConfig) {
    return item.id;
  }

  /**
   * Private method to emit an event using the specified output as an `EventEmitter`.
   * @param {EventEmitter<ButtonEvent>} emitter is the output to emit the `ButtonEvent`
   * @param {KeyboardEvent | MouseEvent} event is the source that triggered this method
   * @param {ButtonEvent} dataToEmit payload to emit
   */
  private triggerOnMouseAndKeyboard(emitter: EventEmitter<ButtonEvent>,
                                    event: KeyboardEvent | MouseEvent,
                                    dataToEmit: ButtonEvent) {
    if (!emitter) {
      console.error('UpperButtonsComponent unknown emitter in triggerOnMouseAndKeyboard');
    }

    const result: number = super.handleImageEvent(event);
    if (result === NEXT) {
      emitter.emit(dataToEmit);
    }
  }

  /**
   * Private method to add ids to the array of buttons.
   * @param {ButtonConfig[]} buttons config array
   * @returns {ButtonConfig[]} the input array with incremental numeric ids
   */
  private addButtonIds(buttons: ButtonConfig[]): ButtonConfig[] {
    return buttons.map((val: ButtonConfig, i: number) => Object.assign({}, val, {id: i}));
  }

  /**
   * Private method to valid custom buttons received as input.
   * @param {ButtonConfig[]} buttons config array
   * @returns {ButtonConfig[]} the same input buttons config array
   * @throws an error is exists a button with an unknown type
   */
  private validateCustomButtons(buttons: ButtonConfig[] = []): ButtonConfig[] {
    buttons.forEach((val: ButtonConfig) => {
      const isValidBtnType: ButtonType | void = WHITELIST_BUTTON_TYPES
        .find((btnType: ButtonType) => btnType === val.type);

      if (!isValidBtnType) {
        throw new Error(`Unknown ButtonType. For custom types use ButtonType.CUSTOM`);
      }
    });
    return buttons;
  }
}
