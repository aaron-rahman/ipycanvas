// Copyright (c) Martin Renou
// Distributed under the terms of the Modified BSD License.

import {
  DOMWidgetModel, DOMWidgetView, ISerializers
} from '@jupyter-widgets/base';

import {
  MODULE_NAME, MODULE_VERSION
} from './version';


export
class CanvasModel extends DOMWidgetModel {
  defaults() {
    return {...super.defaults(),
      _model_name: CanvasModel.model_name,
      _model_module: CanvasModel.model_module,
      _model_module_version: CanvasModel.model_module_version,
      _view_name: CanvasModel.view_name,
      _view_module: CanvasModel.view_module,
      _view_module_version: CanvasModel.view_module_version,
      size: [],
      fill_style: 'black',
      stroke_style: 'black'
    };
  }

  static serializers: ISerializers = {
    ...DOMWidgetModel.serializers,
    // Add any extra serializers here
  }

  initialize(attributes: any, options: any) {
    super.initialize(attributes, options);

    this.commandsCache = [];

    this.cacheSetCommand('fill_style', 'fillStyle');
    this.cacheSetCommand('stroke_style', 'strokeStyle');
    this.cacheSetCommand('global_alpha', 'globalAlpha');

    this.on('msg:custom', (command) => { this.commandsCache.push(command); });

    this.on('change:fill_style', () => { this.cacheSetCommand('fill_style', 'fillStyle'); });
    this.on('change:stroke_style', () => { this.cacheSetCommand('stroke_style', 'strokeStyle'); });
    this.on('change:global_alpha', () => { this.cacheSetCommand('global_alpha', 'globalAlpha'); });
  }

  cacheSetCommand(python_name: string, ts_name: string) {
    this.commandsCache.push({
      name: 'set',
      attr: ts_name,
      value: this.get(python_name)
    });
  }

  static model_name = 'CanvasModel';
  static model_module = MODULE_NAME;
  static model_module_version = MODULE_VERSION;
  static view_name = 'CanvasView';
  static view_module = MODULE_NAME;
  static view_module_version = MODULE_VERSION;

  commandsCache: any;
}


export
class CanvasView extends DOMWidgetView {
  render() {
    this.canvas = document.createElement('canvas');
    this.canvas.width = '100%';
    this.canvas.height = '100%';

    this.el.appendChild(this.canvas);
    this.el.height = '500px';
    this.el.overflow = 'hidden';
    this.el.flex = '1 1 auto';

    this.ctx = this.canvas.getContext('2d');

    this.resize_canvas();

    this.firstDraw();

    this.modelEvents();
  }

  firstDraw() {
    // Replay all the commands that were received until this view was created
    for (const command of (this.model as CanvasModel).commandsCache) {
      if (command.name == 'set') {
        this.ctx[command.attr] = command.value;
      } else {
        this.ctx[command.name](...command.args);
      }
    }
  }

  modelEvents() {
    this.model.on('msg:custom', (command) => {
      this.ctx[command.name](...command.args);
    });

    this.model.on('change:size', () => { this.resize_canvas(); });

    this.model.on('change:fill_style', () => { this.ctx.fillStyle = this.model.get('fill_style'); });
    this.model.on('change:stroke_style', () => { this.ctx.strokeStyle = this.model.get('stroke_style'); });
    this.model.on('change:global_alpha', () => { this.ctx.globalAlpha = this.model.get('global_alpha'); });
  }

  resize_canvas() {
    const size = this.model.get('size');

    this.canvas.setAttribute('width', size[0]);
    this.canvas.setAttribute('height', size[1]);
  }

  canvas: any;
  ctx: any;
}
