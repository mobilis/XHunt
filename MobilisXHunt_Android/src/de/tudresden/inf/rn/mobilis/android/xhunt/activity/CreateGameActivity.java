/*******************************************************************************
 * Copyright (C) 2010 Technische Universität Dresden
 * 
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * 
 * 	http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * 
 * Dresden, University of Technology, Faculty of Computer Science
 * Computer Networks Group: http://www.rn.inf.tu-dresden.de
 * mobilis project: http://mobilisplatform.sourceforge.net
 ******************************************************************************/
/**
 * Activity that shows the Map of the city with all stations and its
 * connections as well as the actual positions of the players.
 */
package de.tudresden.inf.rn.mobilis.android.xhunt.activity;

import java.io.InputStreamReader;
import java.io.Reader;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.xmlpull.v1.XmlPullParser;
import org.xmlpull.v1.XmlPullParserFactory;

import android.app.AlertDialog;
import android.app.Dialog;
import android.content.DialogInterface;
import android.content.DialogInterface.OnCancelListener;
import android.content.Intent;
import android.os.Bundle;
import android.os.Handler;
import android.os.Message;
import android.preference.EditTextPreference;
import android.preference.PreferenceActivity;
import android.util.Log;
import android.view.View;
import android.view.View.OnClickListener;
import android.widget.Button;
import android.widget.Toast;
import de.tudresden.inf.rn.mobilis.android.xhunt.Const;
import de.tudresden.inf.rn.mobilis.android.xhunt.R;
import de.tudresden.inf.rn.mobilis.android.xhunt.clientstub.AreaInfo;
import de.tudresden.inf.rn.mobilis.android.xhunt.clientstub.AreasResponse;
import de.tudresden.inf.rn.mobilis.android.xhunt.clientstub.CreateGameResponse;
import de.tudresden.inf.rn.mobilis.android.xhunt.clientstub.IXMPPCallback;
import de.tudresden.inf.rn.mobilis.android.xhunt.clientstub.Ticket;
import de.tudresden.inf.rn.mobilis.android.xhunt.clientstub.TicketAmount;
import de.tudresden.inf.rn.mobilis.android.xhunt.clientstub.TicketsAgents;
import de.tudresden.inf.rn.mobilis.android.xhunt.clientstub.TicketsMrX;
import de.tudresden.inf.rn.mobilis.android.xhunt.helper.SharedPrefHelper;
import de.tudresden.inf.rn.mobilis.android.xhunt.model.GameState;
import de.tudresden.inf.rn.mobilis.android.xhunt.proxy.MXAProxy;
import de.tudresden.inf.rn.mobilis.android.xhunt.service.ServiceConnector;
import de.tudresden.inf.rn.mobilis.android.xhunt.ui.DialogInput;
import de.tudresden.inf.rn.mobilis.android.xhunt.ui.DialogRemoteLoading;
import de.tudresden.inf.rn.mobilis.android.xhunt.ui.SeekBarPreference;
import de.tudresden.inf.rn.mobilis.mxa.parcelable.XMPPIQ;
import de.tudresden.inf.rn.mobilis.xmpp.beans.XMPPBean;
import de.tudresden.inf.rn.mobilis.xmpp.beans.coordination.CreateNewServiceInstanceBean;
import de.tudresden.inf.rn.mobilis.xmpp.beans.coordination.SendNewServiceInstanceBean;

/**
 * The Class CreateGameActivity is used to start up a new XHunt Service on Mobilis-Server
 * and configure the new game.
 */
public class CreateGameActivity extends PreferenceActivity {
	
	/** Identifier for the Log outputs *. */
	public static final String TAG = "CreateGameActivity";
	
	/** The ServiceConnector to connect to XHuntService. */
	private ServiceConnector mServiceConnector;
	
	/** The MXAProxy. */
	private MXAProxy mMxaProxy;
	
	/** A Helper to read and write easy to the shared preferences. */
	private SharedPrefHelper mSharedPrefHelper;
	
	/** Dialog that displays if client is waiting for server acks. */
	private DialogRemoteLoading mRemoteLoadingDialog;
	
	/** The list of areas known by server. */
	private List<AreaInfo> mAreas;
	
	/** The selected area for this game. */
	private AreaInfo mSelectedArea;
	
	/** The textfield to configure the amount of rounds. */
	private EditTextPreference mEditRounds;
	
	/** The textfield to configure the amount of min players. */
	private EditTextPreference mEditMinPlayers;
	
	/** The textfield to configure the amount of max players. */
	private EditTextPreference mEditMaxPlayers;
	
	/** The textfield to configure the start timer for Mr.X. */
	private EditTextPreference mEditStartTimer;
	
	/** The textfield to configure the location polling interval for the server. */
	private EditTextPreference mEditPollingInterval;
	
	/** The map(ticketId, seekbar with amount of tickets) 
	 * contains the tickets for Mr.X. */
	private HashMap<Integer, SeekBarPreference> mPrefTicketsMrX 
		= new HashMap<Integer, SeekBarPreference>();
	
	/** The map(ticketId, seekbar with amount of tickets) 
	 * contains the tickets for the agents. */
	private HashMap<Integer, SeekBarPreference> mPrefTicketsAgents 
		= new HashMap<Integer, SeekBarPreference>();
	
	
    /* The handler for the AreasBean shows a dialog to choose an area.
     */
    private Handler mAreasHandler = new Handler() {
		/*@Override
		public void handleMessage(Message msg) {
			if(mRemoteLoadingDialog != null){
				mRemoteLoadingDialog.cancel();
			}
			
			showAreasDialog();
		}*/
	};
	
    /** The handler for the CreateGameBean switch to the LobbyActivity, 
     * if game was created successfully. */
    private Handler mCreateGameHandler = new Handler() {
		@Override
		public void handleMessage(Message msg) {
			
			if(mRemoteLoadingDialog != null){
				mRemoteLoadingDialog.cancel();
			}
			
			if(msg.what == -1){
				Toast.makeText(CreateGameActivity.this, 
						"Couldn't create game. Reasons: " + msg.obj.toString(),
						Toast.LENGTH_LONG).show();
			}
			else{
				startActivity(new Intent(CreateGameActivity.this, LobbyActivity.class));
				CreateGameActivity.this.finish();
			}
		}
	};
	
    /** The handler for the CreateNewServiceInstanceBean to create a new Game instance if the new 
     * service instance was created. */
    private Handler mCreateNewInstanceHandler = new Handler() {
		@Override
		public void handleMessage(Message msg) {
			
			if(mRemoteLoadingDialog != null){
				mRemoteLoadingDialog.cancel();
			}
			
			createGame();
			//loadAreaInformation();
		}
	};
	
	/** The handler which is called if the XHuntService was bound. */
    private Handler mXHuntServiceBoundHandler = new Handler() {
		@Override
		public void handleMessage(Message msg) {
			
			mServiceConnector.getXHuntService().setGameState(new GameStateCreateGame());
			mMxaProxy = mServiceConnector.getXHuntService().getMXAProxy();
			mSharedPrefHelper = mServiceConnector.getXHuntService().getSharedPrefHelper();
			
			initValues();
			initComponents();
			parseAreasXml();
			showGameNameDialog();
		}
	};
	
	
	/**
	 * Bind XHuntService using the mXHuntServiceBoundHandler.
	 */
	private void bindXHuntService(){
    	mServiceConnector = new ServiceConnector(this);
    	mServiceConnector.doBindXHuntService(mXHuntServiceBoundHandler);
	}
	
	/**
	 * Creates a new service instance on the server.
	 */
	private void createService() {
		mRemoteLoadingDialog.setLoadingText("Creating new game instance.\n\n     Please wait...");
		mRemoteLoadingDialog.run();
		
		// Create new service instance with the given name
		mMxaProxy.getIQProxy().sendCreateNewServiceInstanceIQ("http://mobilis.inf.tu-dresden.de#services/MobilisXHuntService",
				mSharedPrefHelper.getValue(getKeyGameName()), null);
	}
	
	/**
	 * Creates the new game and validate the inputs.
	 */
	private void createGame() {
		mRemoteLoadingDialog.setLoadingText("Creating game.\n\n     Please wait...");
		//mRemoteLoadingDialog.run();
		
		//FIXME: should be optimized
		int rounds = 10;
		int starttimer = 15;
		int locPollInterval = 10;
		int minplayers = 1;
		int maxplayers = 6;
		
		// Read typed in game configuration stored in the shared preferences.
		try{
			rounds = Integer.valueOf(mSharedPrefHelper.getValue(getKeyRounds()));
			starttimer = Integer.valueOf(mSharedPrefHelper.getValue(getKeyStartTimer()));
			locPollInterval = Integer.valueOf(mSharedPrefHelper.getValue(getKeyPollingInterval()));
			minplayers = Integer.valueOf(mSharedPrefHelper.getValue(getKeyMinPlayers()));
			maxplayers = Integer.valueOf(mSharedPrefHelper.getValue(getKeyMaxPlayers()));
		}
		catch(Exception e) { Log.e(this.getClass().toString(), e.getMessage()); }
		
		List<TicketAmount> ticketsMrX = new ArrayList<TicketAmount>();
		List<TicketAmount> ticketsAgents = new ArrayList<TicketAmount>();
		
		for(Map.Entry<Integer, SeekBarPreference> entry : mPrefTicketsMrX.entrySet()){
			int amount = 0;
			
			try{
				//amount = Integer.valueOf(mSharedPrefHelper.getValue(entry.getValue().getKey()));
				amount = mSharedPrefHelper.getValueAsInt(entry.getValue().getKey());
			}
			catch(Exception e) { Log.e(this.getClass().toString(), e.getMessage()); }

			if(amount > 0)
				ticketsMrX.add(new TicketAmount(entry.getKey(), amount));
		}
		
		for(Map.Entry<Integer, SeekBarPreference> entry : mPrefTicketsAgents.entrySet()){
			int amount = 0;
			
			try{
				amount = mSharedPrefHelper.getValueAsInt(entry.getValue().getKey());
			}
			catch(NumberFormatException e){ Log.e(this.getClass().toString(), e.getMessage()); }
			
			if(amount > 0)
				ticketsAgents.add( new TicketAmount(entry.getKey(), amount));
		}
		
		// Send a create game request with the configuration to the XHunt-Service
		mMxaProxy.getIQProxy().getProxy().CreateGame( 
				mMxaProxy.getIQProxy().getGameServiceJid(),
				mSelectedArea.getAreaId(), 
				mSharedPrefHelper.getValue(getKeyGameName()),
				null,
				rounds,				
				minplayers,
				maxplayers,
				starttimer * 1000,
				locPollInterval * 1000,
				new TicketsMrX( ticketsMrX ),
				new TicketsAgents( ticketsAgents ), 
				_createGameCallback );
	}
	
	private IXMPPCallback< CreateGameResponse > _createGameCallback = new IXMPPCallback< CreateGameResponse >() {
		
		@Override
		public void invoke( CreateGameResponse bean ) {
			
			if(bean.getType() == XMPPIQ.TYPE_ERROR
					&& bean.errorText != null){
				Message msg = new Message();
				msg.what = -1;
				msg.obj = bean.errorText;
				mCreateGameHandler.sendMessage(msg);
			}
			
			else if( bean != null && bean.getType() != XMPPBean.TYPE_ERROR ){
				mCreateGameHandler.sendEmptyMessage(0);
			}
		}
	};
    
    /**
     * Creates a new Service instance of the XHunt-Service on the Mobilis-Server.
     */
    private void showGameNameDialog() {
    	
    	// User can type in a name for the service
    	final DialogInput inDialog = new DialogInput(this, "Type in Game Name:");
    	inDialog.setInputText(mSharedPrefHelper.getValue(getKeyGameName()));
    	inDialog.setPositiveButton("Ok", new Dialog.OnClickListener() {
			
			@Override
			public void onClick(DialogInterface dialog, int which) {
				if(inDialog.getInputText().length() > 0){
					mSharedPrefHelper.setValue(getKeyGameName(), inDialog.getInputText());			
					mSharedPrefHelper.save();
				}
				
				showAreasDialog();
			}
		});
    	
    	// On cancel, the CreateGameActivity will be finished and the application navigates 
    	// back to the OpenGamesActivity
    	inDialog.setNegativeButton("Cancel", new Dialog.OnClickListener() {
			
			@Override
			public void onClick(DialogInterface dialog, int which) {
				CreateGameActivity.this.finish();
			}
		});
    	
    	AlertDialog gameNameDialog = inDialog.create();
    	//gameNameDialog.setCancelable(false);
    	gameNameDialog.setCanceledOnTouchOutside(false);
    	gameNameDialog.setOnCancelListener(new OnCancelListener() {
			@Override
			public void onCancel(DialogInterface dialog) {
				CreateGameActivity.this.finish();
			}
		});
    	gameNameDialog.show();

    }
    
    /**
     * Creates a new entry in the list of the tickets for this game.
     *
     * @param ticketName the name of the ticket
     * @param role the role of the player (Mr.X or Agent)
     * @return the edits the text preference
     */
    private SeekBarPreference createTicketPrefEntry(String ticketName, String role) {

    	int defaultTicketCount = 1000;
    	SeekBarPreference seekbar = new SeekBarPreference(this, 0, defaultTicketCount, defaultTicketCount, "tickets");
		
		seekbar.setKey("key_newgame_" + role.toLowerCase() + ticketName.toLowerCase());
		seekbar.setTitle(ticketName + " (" + role + ")");
		seekbar.setSummary("set number of tickets");
		
		if(mSharedPrefHelper.getValueAsInt(seekbar.getKey()) == -1)
			mSharedPrefHelper.setValueInt(seekbar.getKey(), defaultTicketCount);
		
		return seekbar;
    }
	
	/* (non-Javadoc)
	 * @see android.app.Activity#finish()
	 */
	@Override
	public void finish() {
		mServiceConnector.doUnbindXHuntService();
		super.finish();
	}
	
	/**
	 * Gets the key of the game name resource.
	 *
	 * @return the key of the game name resource
	 */
	private String getKeyGameName(){
		return getResources().getString(R.string.bundle_key_newgame_name);
	}
	
	/**
	 * Gets the key of the rounds resource.
	 *
	 * @return the key of the rounds resource
	 */
	private String getKeyRounds(){
		return getResources().getString(R.string.bundle_key_newgame_rounds);
	}
	
	/**
	 * Gets the key of the min players resource.
	 *
	 * @return the key of the min players resource
	 */
	private String getKeyMinPlayers(){
		return getResources().getString(R.string.bundle_key_newgame_minplayers);
	}
	
	/**
	 * Gets the key of the max players resource.
	 *
	 * @return the key of the max players resource
	 */
	private String getKeyMaxPlayers(){
		return getResources().getString(R.string.bundle_key_newgame_maxplayers);
	}
	
	/**
	 * Gets the key of the start timer resource.
	 *
	 * @return the key of the start timer resource
	 */
	private String getKeyStartTimer(){
		return getResources().getString(R.string.bundle_key_newgame_starttimer);
	}
	
	/**
	 * Gets the key of the location polling interval.
	 * 
	 * @return the key of the location polling interval
	 */
	private String getKeyPollingInterval() {
		return getResources().getString(R.string.bundle_key_newgame_pollinginterval);
	}
	
	/**
	 * Initialize all UI elements from resources.
	 */
	private void initComponents() {
		
		mRemoteLoadingDialog = new DialogRemoteLoading(this, Const.CONNECTION_TIMEOUT_DELAY);
		
		mEditRounds = (EditTextPreference)getPreferenceScreen().findPreference(
				getKeyRounds());
		mEditMinPlayers = (EditTextPreference)getPreferenceScreen().findPreference(
				getKeyMinPlayers());
		mEditMaxPlayers = (EditTextPreference)getPreferenceScreen().findPreference(
				getKeyMaxPlayers());
		mEditStartTimer = (EditTextPreference)getPreferenceScreen().findPreference(
				getKeyStartTimer());
		mEditPollingInterval = (EditTextPreference)getPreferenceScreen().findPreference(
				getKeyPollingInterval());
		
		updateSummaries();

		
		Button btn_Create = (Button)findViewById(R.id.creategame_btn_create);
		btn_Create.setOnClickListener(new OnClickListener() {	
			
			@Override
			public void onClick(View v) {
				if(v instanceof Button)
					((Button) v).setEnabled(false);
				
				createService();
			}
		});
	}

	/**
	 * Initialize the default values of the games configuration values. If there was 
	 * set a configuration before, this values will be used again, else default 
	 * values will be used.
	 */
	private void initValues(){
		
		if(mSharedPrefHelper.getValue(getResources()
				.getString(R.string.bundle_key_newgame_name)) == null){
			mSharedPrefHelper.setValue(
					getResources().getString(R.string.bundle_key_newgame_name),
					"Gamex");
		}
		
		if(mSharedPrefHelper.getValue(getResources()
				.getString(R.string.bundle_key_newgame_password)) == null){
			mSharedPrefHelper.setValue(
					getResources().getString(R.string.bundle_key_newgame_password),
					null);
		}
		
		if(mSharedPrefHelper.getValue(getResources()
				.getString(R.string.bundle_key_newgame_minplayers)) == null){
			mSharedPrefHelper.setValue(
					getResources().getString(R.string.bundle_key_newgame_minplayers),
					"" + 1);
		}
		
		if(mSharedPrefHelper.getValue(getResources()
				.getString(R.string.bundle_key_newgame_maxplayers)) == null){
			mSharedPrefHelper.setValue(
					getResources().getString(R.string.bundle_key_newgame_maxplayers),
					"" + 6);
		}
		
		if(mSharedPrefHelper.getValue(getResources()
				.getString(R.string.bundle_key_newgame_rounds)) == null){
			mSharedPrefHelper.setValue(
					getResources().getString(R.string.bundle_key_newgame_rounds),
					"" + 10);
		}
		
		if(mSharedPrefHelper.getValue(getResources()
				.getString(R.string.bundle_key_newgame_starttimer)) == null){
			mSharedPrefHelper.setValue(
					getResources().getString(R.string.bundle_key_newgame_starttimer),
					"" + 15);
		}
		
		if(mSharedPrefHelper.getValue(getResources()
				.getString(R.string.bundle_key_newgame_pollinginterval)) == null){
			int polInterval = mMxaProxy.isStaticMode() ? 2 : 10;
			mSharedPrefHelper.setValue(
					getResources().getString(R.string.bundle_key_newgame_pollinginterval),
					"" + polInterval);
		}
		
		mServiceConnector.getXHuntService().getSharedPrefHelper().save();
	}
	
	/*
	 * Load area information.
	 * Not really needed anymore, because now using parseAreasXml(), but Server still expects an Area Request.
	 */
	/*private void loadAreaInformation() {

		//mRemoteLoadingDialog.setLoadingText("Requesting Area information.\n\n     Please wait...");
		mRemoteLoadingDialog.setLoadingText("Going to Lobby...");
		mRemoteLoadingDialog.run();
		
		mMxaProxy.getIQProxy().getProxy().Areas( mMxaProxy.getIQProxy().getGameServiceJid(), _areaCallback );
	}*/

	
	/* (non-Javadoc)
	 * @see android.preference.PreferenceActivity#onCreate(android.os.Bundle)
	 */
	@Override
	protected void onCreate(Bundle savedInstanceState) {
		super.onCreate(savedInstanceState);
		
		addPreferencesFromResource(R.xml.layout_creategame);
		this.setDefaultKeyMode(MODE_PRIVATE);
		setContentView(R.layout.activity_creategame);
		
		bindXHuntService();
	}

	/* (non-Javadoc)
	 * @see android.app.Activity#onWindowFocusChanged(boolean)
	 */
	@Override
	public void onWindowFocusChanged(boolean hasFocus) {
		updateSummaries();
		super.onWindowFocusChanged(hasFocus);
	}
    
    /**
     * Shows a dialog which contains all areas known by the Mobilis-Server.
     */
    private void showAreasDialog(){
    	
    	if(mAreas.size() > 0){
	    	List<String> areaList = new ArrayList<String>();
	    	
	    	for(AreaInfo info : mAreas){
	    		areaList.add(info.getAreaName());
	    	}
	    	
	    	final CharSequence[] items = areaList.toArray(new CharSequence[areaList.size()]);
	
	    	AlertDialog.Builder builder = new AlertDialog.Builder(this);
	    	builder.setTitle("Choose an Area:");
	    	builder.setItems(items, new DialogInterface.OnClickListener() {
	    	    public void onClick(DialogInterface dialog, int item) {    	        
	    	    	mSelectedArea = mAreas.get(item);
	    	    	
	    	    	for(Ticket entry : mSelectedArea.getTickets()){
	    	    		SeekBarPreference prefMrX = createTicketPrefEntry(entry.getName(), "Mr.X");
	    	    		SeekBarPreference prefAgents = createTicketPrefEntry(entry.getName(), "Agents");
	    	    		
	    	    		/* commented out since tickets became hidden
	    	    		getPreferenceScreen().addPreference(prefMrX);
	    	    		getPreferenceScreen().addPreference(prefAgents); */
	    	    		
	    	    		mPrefTicketsMrX.put(entry.getID(), prefMrX);
	    	    		mPrefTicketsAgents.put(entry.getID(), prefAgents);
	    	    	}
	    	    	
	    	    	mSharedPrefHelper.save();
	    	    }
	
	    	});
	    	
	    	AlertDialog alert = builder.create();
	    	//alert.setCancelable(false);
	    	alert.setCanceledOnTouchOutside(false);
	    	alert.setOnCancelListener(new OnCancelListener() {
				@Override
				public void onCancel(DialogInterface dialog) {
					CreateGameActivity.this.finish();
				}
			});
	    	alert.show();
    	}
    	
    	else {
    		AlertDialog.Builder alert = new AlertDialog.Builder(this);
    		alert.setMessage("You can not create a new game, because there are no Maps available!");
    		
    		alert.setTitle("No Maps found");
    		alert.setIcon(R.drawable.ic_error_48);
    		
    		alert.setPositiveButton("OK", new DialogInterface.OnClickListener() {
        		public void onClick(DialogInterface dialog, int whichButton) {
        			CreateGameActivity.this.finish();
        		}
    		});

    		alert.show();
    	}
    }
    
	/**
	 * Update summaries of all preference entries.
	 * A summary displays the current value of a preference.
	 */
	private void updateSummaries(){
		if (mEditMaxPlayers != null)
			mEditMaxPlayers.setSummary(mSharedPrefHelper.getValue(mEditMaxPlayers.getKey()));
		if (mEditMinPlayers != null)
			mEditMinPlayers.setSummary(mSharedPrefHelper.getValue(mEditMinPlayers.getKey()));
		if (mEditRounds != null)
			mEditRounds.setSummary(mSharedPrefHelper.getValue(mEditRounds.getKey()));
		if (mEditPollingInterval != null)
			mEditPollingInterval.setSummary(mSharedPrefHelper.getValue(mEditPollingInterval.getKey()));
		if (mEditStartTimer != null) {
			mEditStartTimer.setSummary(mSharedPrefHelper.getValue(mEditStartTimer.getKey()));	
			
			// add unit information
			String startTimerVal = mSharedPrefHelper.getValue(getKeyStartTimer());	
			if(startTimerVal != null)
				mEditStartTimer.setSummary(startTimerVal + "sec");
			else mEditStartTimer.setSummary("not set");
			
			String locPollVal = mSharedPrefHelper.getValue(getKeyPollingInterval());
			if(locPollVal != null)
				mEditPollingInterval.setSummary(locPollVal + "sec");
			else mEditPollingInterval.setSummary("not set");
		}
	}
	
	/*
	 * Functionality not needed anymore, now using parseAreasXml().
	 */
	private IXMPPCallback< AreasResponse > _areaCallback = new IXMPPCallback< AreasResponse >() {
		
		@Override
		public void invoke( AreasResponse bean ) {
			/*if( bean != null && bean.getType() != XMPPBean.TYPE_ERROR ){
				mAreas = new ArrayList<AreaInfo>();
				for (AreaInfo area : bean.getAreas()) {
					boolean alreadyExist = false;
					for (AreaInfo info : mAreas) {
						if( info.getAreaId() == area.getAreaId() ){
							alreadyExist = true;
							break;
						}
					}
					
					if(alreadyExist)
						continue;
					else
						mAreas.add(area);
				}
				
				Log.v( TAG, "area size = " + bean.getAreas().size() );
				*/
				mAreasHandler.sendEmptyMessage(0);
				createGame();
			//}
		}
	};
    
    
    /**
     * The Class GameStateCreateGame is a GameState.
     */
    private class GameStateCreateGame extends GameState {

		/* (non-Javadoc)
		 * @see de.tudresden.inf.rn.mobilis.android.xhunt.model.GameState#processPacket(de.tudresden.inf.rn.mobilis.xmpp.beans.XMPPBean)
		 */
		@Override
		public void processPacket(XMPPBean inBean) {
			
			if(inBean.getType() == XMPPBean.TYPE_ERROR){
				Log.e(TAG, "IQ Type ERROR: " + inBean.toXML());
				
				if(inBean.errorText != null)
					Log.e(TAG, "errorText: " + inBean.errorText);
			}
			
			// Handle CreateNewServiceInstanceBean
			if( inBean instanceof CreateNewServiceInstanceBean){
				CreateNewServiceInstanceBean bean = (CreateNewServiceInstanceBean)inBean;
				
				if( bean != null && bean.getType() == XMPPBean.TYPE_RESULT ){
					//just ok. creating instance is in progress
				}
			}
			
			if( inBean instanceof SendNewServiceInstanceBean){
				SendNewServiceInstanceBean bean = (SendNewServiceInstanceBean) inBean;
				if( bean !=null && bean.getType() == XMPPBean.TYPE_SET){
					mMxaProxy.getIQProxy().setGameServiceJid(bean.jidOfNewService);
					mMxaProxy.getIQProxy().setServiceVersion( bean.serviceVersion );		
					mCreateNewInstanceHandler.sendEmptyMessage(0);
					mMxaProxy.getIQProxy().AnswerSendNewServiceInstance(bean);
				}
			}
			// Other Beans of type get or set will be responded with an ERROR
			else if(inBean.getType() == XMPPBean.TYPE_GET
					|| inBean.getType() == XMPPBean.TYPE_SET) {
				inBean.errorType = "wait";
				inBean.errorCondition = "unexpected-request";
				inBean.errorText = "This request is not supportet at this game state(create)";
				
				mMxaProxy.getIQProxy().sendXMPPBeanError(inBean);
			}			
		}
    	
    }
    
    
    /**
     * Fill mAreas-List with Data from xml file
     */
    private void parseAreasXml() {
    	mAreas = new ArrayList<AreaInfo>();
    	
    	Reader reader = new InputStreamReader(getResources().openRawResource(R.raw.area_1_v1));
    	XmlPullParser parser;
    	
    	try {
			parser = XmlPullParserFactory.newInstance().newPullParser();
	    	parser.setInput(reader);
	    	
	    	boolean done = false;
	    	
	    	int areaID = -1;
	    	int version = -1;
	    	String areaName = "";
	    	String areaDescr = "";
	    	List<Ticket> areaTickets = new ArrayList<Ticket>();
	    	
	    	do {
	    		switch(parser.getEventType()) {
	    		
	    			case XmlPullParser.START_TAG:
	    				String tagName = parser.getName();
	    				
	    				if(tagName.equals("area"))
	    					parser.next();
	    				
	    				else if(tagName.equals("id"))
	    					areaID = Integer.valueOf(parser.nextText()).intValue();
	    				
	    				else if(tagName.equals("name"))
	    					areaName = parser.nextText();
	    				
	    				else if(tagName.equals("desc"))
	    					areaDescr = parser.nextText();
	    				
	    				else if(tagName.equals("version"))
	    					version = Integer.valueOf(parser.nextText()).intValue();
	    				
	    				else if(tagName.equals("Ticket")) {
	    					Ticket ticket = new Ticket();
	    					for(int i=0; i<parser.getAttributeCount(); i++){
	    						if(parser.getAttributeName(i).equals("id"))
	    							ticket.setID(Integer.valueOf(parser.getAttributeValue(i)));
	    						else if(parser.getAttributeName(i).equals("name"))
	    							ticket.setName(parser.getAttributeValue(i));
	    					}
	    					
	    					areaTickets.add(ticket);
	    					parser.next();
	    				}
	    				
	    				else
	    					parser.next();
	    				
	    				break;
	    				
	    			case XmlPullParser.END_TAG:
	    				if(parser.getName().equals("area"))
	    					done = true;
	    				else
	    					parser.next();
	    				break;
	    				
	    			case XmlPullParser.END_DOCUMENT:
	    				done = true;
	    				break;
	    				
	    			default:
	    				parser.next();			
	    		}
	    		
	    	} while(!done);
	    	
	    	AreaInfo areaInfo = new AreaInfo();
	    	areaInfo.setAreaId(areaID);
	    	areaInfo.setAreaName(areaName);
	    	areaInfo.setAreaDescription(areaDescr);
	    	areaInfo.setVersion(version);
	    	areaInfo.setTickets(areaTickets);
	    	
	    	mAreas.add(areaInfo);
	    	
		} catch (Exception e) {
			e.printStackTrace();
		}	
    }
}