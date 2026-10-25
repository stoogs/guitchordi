class FirmwareSimulator extends AudioWorkletProcessor {
  constructor(options) {
    super();
    this.e = new WebAssembly.Instance(options.processorOptions.module, {}).exports;
    this.e._initialize(); this.e.fw_boot();
    const store = options.processorOptions.store;
    if (Array.isArray(store) && [21,32,42,44,45].includes(store.length)) {
      new Uint32Array(this.e.memory.buffer,this.e.fw_store(),45).set(store); this.e.fw_restore();
    }
    this.audio = new Float32Array(this.e.memory.buffer,this.e.fw_render(128),128);
    this.blocks = 0; this.writes = 0; this.lastScreen = '';
    this.port.onmessage = ({data}) => {
      if(data.type==='keys') this.e.fw_keys(data.mask>>>0);
      if(data.type==='button'){if(data.button===2)this.holdingLock=!!data.down;this.e.fw_button(data.button,data.down?1:0);}
      if(data.type==='encoder') this.e.fw_encoder(data.role,data.delta|0);
      if(data.type==='tone')this.e.fw_set_tone(data.index|0);
      if(data.type==='mode')this.e.fw_set_mode(data.index|0);
      if(data.type==='master') this.e.fw_master(data.value|0);
      if(data.type==='panic'){this.holdingLock=false;this.e.fw_panic();}
    };
  }
  name(pointer) {
    const bytes=new Uint8Array(this.e.memory.buffer);let text='';
    for(let i=pointer;bytes[i]&&i<pointer+80;i++)text+=String.fromCharCode(bytes[i]);
    return text;
  }
  process(inputs,outputs) {
    const out=outputs[0]; if(!out?.length)return true;
    if(sampleRate!==44100){for(const channel of out)channel.fill(0);return true;}
    this.e.fw_render(out[0].length);
    for(const channel of out) channel.set(this.audio);
    // Poll at ~20 Hz; transfer LCD pixels only when the application screen changes.
    if(++this.blocks%18===0){
      const e=this.e;
      const message={suggestions:Array.from({length:11},(_,i)=>e.fw_suggestion(i)),suggestionReasons:Array.from({length:11},(_,i)=>e.fw_suggestion_reason(i)),brightness:Array.from({length:27},(_,i)=>e.fw_key_brightness(i)),pitches:Array.from({length:16},(_,i)=>e.fw_key_pitch(i)),mode:e.fw_mode(),custom:e.fw_custom(),chords:Array.from({length:11},(_,i)=>this.name(e.fw_slot_name(i))),keys:e.fw_lights(),muted:e.fw_muted(),buttons:e.fw_buttons(),
        lastKey:e.fw_last_key(),lastPitch:e.fw_last_pitch(),now:e.fw_now(),attacks:e.fw_attacks(),active:e.gm_active(),steals:e.gm_steals(),clips:e.gm_clips(),
        selected:e.fw_selected(),chord:e.fw_chord(),voicing:e.fw_voicing(),voicingCount:e.fw_voicing_count(),slotVoicings:Array.from({length:11},(_,i)=>e.fw_slot_voicing(i)),editing:e.fw_editing(),resetMenu:e.fw_reset_menu(),locked:e.fw_locked(),tone:e.fw_tone(),transpose:e.fw_transpose(),
        tuning:e.fw_tuning(),tuningCount:e.fw_tuning_count(),tuningName:this.name(e.fw_tuning_name(e.fw_tuning())),tuningLabel:this.name(e.fw_tuning_label()),openPitches:Array.from({length:6},(_,i)=>e.fw_open_pitch(i)),gateTails:e.fw_gate_tails(),humanity:e.fw_humanity(),performance:e.fw_play_mode(),bpm:e.fw_bpm(),tempoEdit:e.fw_tempo_edit(),rhythm:Array.from({length:4},(_,i)=>e.fw_rhythm_param(i)),running:e.fw_running(),lockProgress:e.fw_lock_progress(),volume:e.fw_volume(),velocity:e.fw_velocity(),room:e.fw_room(),page:e.fw_page(),control:e.fw_control(),stateBytes:e.fw_state_bytes()};
      const writes=e.fw_store_version();
      if(writes!==this.writes){message.store=Array.from(new Uint32Array(e.memory.buffer,e.fw_store(),45));this.writes=writes;}
      const signature=[message.keys,message.muted,message.buttons,message.attacks,message.active,message.steals,
        message.tuning,message.gateTails,message.humanity,message.performance,message.bpm,message.tempoEdit,message.rhythm.join(),message.running,Math.floor(message.lockProgress/30),message.voicing,message.resetMenu,message.control,message.mode,message.custom,message.chords.join(),message.selected,message.chord,message.editing,message.locked,message.tone,message.transpose,message.volume,message.velocity,message.room,message.page,
        this.holdingLock?Math.floor(message.now/100):0].join(':');
      const transfer=[];
      if(signature!==this.lastScreen){
        this.lastScreen=signature;
        message.frame=new Uint16Array(e.memory.buffer,e.fw_frame(),240*240).slice();transfer.push(message.frame.buffer);
      }
      this.port.postMessage(message,transfer);
    }
    return true;
  }
}
registerProcessor('guitchordi-firmware',FirmwareSimulator);
