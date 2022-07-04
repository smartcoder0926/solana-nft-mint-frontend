import {
  createConnectionConfig,
  getParsedNftAccountsByOwner,
  isValidSolanaAddress,
} from '@nfteyez/sol-rayz';
import { useWallet } from '@solana/wallet-adapter-react';
import { useEffect, useRef, useState } from 'react';
import { Badge, Button, Card, Col, Form, Row } from 'react-bootstrap';
import AlertDismissible from './alert/alertDismissible';
import './App.css';

import * as anchor from '@project-serum/anchor';
import { Provider } from '@project-serum/anchor';

import { Connection } from '@solana/web3.js';
import {
  addBlList,
  addOgList,
  addWlList,
  initialize,
  multiMint,
  removeBlList,
  removeOgList,
  removeWlList,
  setStage,
  setUri,
  updateAmount,
  updatePrice,
  _getState,
} from './utils';
const opts = {
  preflightCommitment: 'processed',
};

function App(props) {
  const { publicKey } = useWallet();
  const { connection } = props;
  const wallet = useWallet();
  // input ref
  const inputRef = useRef();
  const ogkey = useRef();
  const wlkey = useRef();
  const blkey = useRef();
  const og_price = useRef();
  const wl_price = useRef();
  const public_price = useRef();
  const og_amount = useRef();
  const wl_amount = useRef();
  const public_amount = useRef();
  const cur_stage = useRef();
  const mint_cnt = useRef();
  const base_uri = useRef();

  // state change
  useEffect(() => {
    setNfts([]);
    setView('collection');
    setGroupedNfts([]);
    setShow(false);
    if (publicKey) {
      inputRef.current.value = publicKey;
      getState();
    }
  }, [publicKey, connection]);

  const [nfts, setNfts] = useState([]);
  const [groupedNfts, setGroupedNfts] = useState([]);
  const [view, setView] = useState('collection');
  //alert props
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [show, setShow] = useState(false);

  //loading props
  const [loading, setLoading] = useState(false);

  const [curStage, setCurStage] = useState('');
  const [mintable, setMintable] = useState(false);
  const [price, setPrice] = useState(0);

  const getNfts = async (e) => {
    e.preventDefault();

    setShow(false);

    let address = inputRef.current.value;

    if (address.length === 0) {
      address = publicKey;
    }

    if (!isValidSolanaAddress(address)) {
      setTitle('Invalid address');
      setMessage('Please enter a valid Solana address or Connect your wallet');
      setLoading(false);
      setShow(true);
      return;
    }

    const connect = createConnectionConfig(connection);

    setLoading(true);
    const nftArray = await getParsedNftAccountsByOwner({
      publicAddress: address,
      connection: connect,
      serialization: true,
    });

    if (nftArray.length === 0) {
      setTitle('No NFTs found in ' + props.title);
      setMessage('No NFTs found for address: ' + address);
      setLoading(false);
      setView('collection');
      setShow(true);
      return;
    }

    const metadatas = await fetchMetadata(nftArray);
    var group = {};

    for (const nft of metadatas) {
      if (group.hasOwnProperty(nft.data.symbol)) {
        group[nft.data.symbol].push(nft);
      } else {
        group[nft.data.symbol] = [nft];
      }
    }
    setGroupedNfts(group);
    console.log(group);

    setLoading(false);
    return setNfts(metadatas);
  };

  const fetchMetadata = async (nftArray) => {
    let metadatas = [];
    for (const nft of nftArray) {
      console.log(nft);
      try {
        await fetch(nft.data.uri)
          .then((response) => response.json())
          .then((meta) => {
            metadatas.push({ ...meta, ...nft });
          });
      } catch (error) {
        console.log(error);
      }
    }
    return metadatas;
  };
  const getProvider = async () => {
    /* create the provider and return it to the caller */
    /* network set to local network for now */
    const network = 'https://metaplex.devnet.rpcpool.com';
    const connection = new Connection(network, opts.preflightCommitment);

    const provider = new Provider(connection, wallet, opts.preflightCommitment);
    return provider;
  };

  async function nftMint() {
    const provider = await getProvider();
    // provider.sendAll()
    // const min = 0;
    // const max = 5;
    // var rand = min + Math.random() * (max - min);
    // rand = Math.floor(rand);
    console.log(mint_cnt.current.value);
    // for(var i=0;i<mint_cnt.current.value;i++){
    if (mint_cnt.current.value <= 0) return;

    await multiMint(provider, wallet, price, mint_cnt.current.value);
    // }
  }

  async function test() {}
  async function init() {
    const provider = await getProvider();
    await initialize(provider, wallet);
  }

  async function addOg() {
    const provider = await getProvider();
    // await addOgList(provider, wallet, [ogkey.current.value]);
    const ogList = [];
    for (let i = 1; i <= 30; i++) {
      const keypair = anchor.web3.Keypair.generate();
      ogList.push(keypair.publicKey);
    }
    console.log(ogList);
    await addOgList(provider, wallet, ogList);
  }

  async function removeOg() {
    const provider = await getProvider();
    await removeOgList(provider, wallet, [ogkey.current.value]);
  }

  async function addWl() {
    const provider = await getProvider();
    const wladdresses = wlkey.current.value.split(',');
    console.log('add wl addresses', wladdresses);
    // await addWlList(provider, wallet, [wlkey.current.value]);
    await addWlList(provider, wallet, wladdresses);
  }

  async function removeWl() {
    const provider = await getProvider();
    await removeWlList(provider, wallet, [wlkey.current.value]);
  }

  async function addBl() {
    const provider = await getProvider();
    await addBlList(provider, wallet, [blkey.current.value]);
  }

  async function removeBl() {
    const provider = await getProvider();
    await removeBlList(provider, wallet, [blkey.current.value]);
  }

  async function changePrice() {
    const provider = await getProvider();
    await updatePrice(
      provider,
      wallet,
      og_price.current.value * 1000,
      wl_price.current.value * 1000,
      public_price.current.value * 1000
    );
  }

  async function changeAmount() {
    const provider = await getProvider();
    await updateAmount(
      provider,
      wallet,
      og_amount.current.value * 1,
      wl_amount.current.value * 1,
      public_amount.current.value * 1
    );
  }
  async function changeStage() {
    const provider = await getProvider();
    await setStage(provider, wallet, cur_stage.current.value * 1);
  }

  async function changeUri() {
    const provider = await getProvider();
    await setUri(provider, wallet, base_uri.current.value);
  }

  async function getState() {
    const provider = await getProvider();
    const cur = await _getState(provider, wallet);
    let sta = 'disabled';
    if (cur.stage == 1) sta = 'WhiteList';
    if (cur.stage == 2) sta = 'Public';
    setCurStage(sta);
    setPrice(cur.price / 1000);
    // setMintable(cur.show);
    setMintable(true);
    cur_stage.current.value = cur.stage;
    og_price.current.value = cur.ogPrice / 1000;
    wl_price.current.value = cur.wlPrice / 1000;
    public_price.current.value = cur.publicPrice / 1000;
    og_amount.current.value = cur.ogAmout;
    wl_amount.current.value = cur.wlAmout;
    public_amount.current.value = cur.publicAmount;
    base_uri.current.value = cur.baseUri;
  }

  return (
    <div className="main">
      <Row>
        <Col lg="3"></Col>
        <Col>
          <h4>CurrentStage: {curStage}</h4>
        </Col>
        <Col>
          <h4>Price: {price}</h4>
        </Col>
        <Col lg="2">
          <Button onClick={getNfts}>Show NFTs</Button>
        </Col>
        {/* <Col lg='1'>
          <Button onClick={test}>test</Button>
        </Col> */}
      </Row>
      <Row className="inputForm">
        <Col xs="12" md="12" lg="5">
          <Form.Control
            type="text"
            readOnly
            ref={inputRef}
            placeholder="Wallet address"
          />
        </Col>
        <Col xs="12" md="12" lg="5" className="d-grid">
          {mintable && (
            <Row>
              <Col lg="1">
                <Button
                  onClick={() => {
                    mint_cnt.current.value = mint_cnt.current.value * 1 + 1;
                  }}
                >
                  +
                </Button>
              </Col>
              <Col lg="2">
                <Form.Control
                  type="text"
                  ref={mint_cnt}
                  // value={mint_cnt.current.value}
                />
              </Col>
              <Col lg="1">
                <Button
                  onClick={() => {
                    mint_cnt.current.value = mint_cnt.current.value * 1 - 1;
                  }}
                >
                  -
                </Button>
              </Col>
              <Col lg="2">
                <Button
                  variant={props.variant.toLowerCase()}
                  type="submit"
                  onClick={nftMint}
                >
                  Mint
                </Button>
              </Col>
            </Row>
          )}
        </Col>
        <Col lg="1">
          {view === 'nft-grid' && (
            <Button
              size="md"
              variant="danger"
              onClick={() => {
                setView('collection');
              }}
            >
              Close
            </Button>
          )}
        </Col>
      </Row>
      <Row className="inputForm">
        <Col lg="4">
          <Form.Control
            type="text"
            ref={ogkey}
            placeholder="OGList Wallet Address"
          />
        </Col>
        <Col sm="1" className="d-grid">
          <Button type="submit" onClick={addOg}>
            Add
          </Button>
        </Col>
        <Col sm="1" className="d-grid">
          <Button type="submit" onClick={removeOg}>
            Remove
          </Button>
        </Col>
      </Row>
      <Row className="inputForm">
        <Col lg="4">
          <Form.Control
            type="text"
            ref={wlkey}
            placeholder="WLList Wallet Address"
          />
        </Col>
        <Col sm="1" className="d-grid">
          <Button type="submit" onClick={addWl}>
            Add
          </Button>
        </Col>
        <Col sm="1" className="d-grid">
          <Button type="submit" onClick={removeWl}>
            Remove
          </Button>
        </Col>
      </Row>
      {/* <Row className='inputForm'>  
        <Col lg="4">
          <Form.Control
            type="text"
            ref={blkey}
            placeholder="BLList Wallet Address"
          />
        </Col>
        <Col sm="1" className="d-grid">
          <Button
            type="submit"
            onClick={addBl}
          >Add
          </Button>
        </Col>
        <Col sm="1" className="d-grid">
          <Button
            type="submit"
            onClick={removeBl}
          >Remove
          </Button>
        </Col>
      </Row> */}
      <Row className="inputForm">
        <Col lg="1">
          <Form.Control type="text" ref={og_price} placeholder="OGPric" />
        </Col>
        <Col lg="1">
          <Form.Control type="text" ref={wl_price} placeholder="WLPric" />
        </Col>
        <Col lg="1">
          <Form.Control type="text" ref={public_price} placeholder="PLPric" />
        </Col>
        <Col lg="1" className="d-grid">
          <Button type="submit" onClick={changePrice}>
            Update
          </Button>
        </Col>
      </Row>

      <Row className="inputForm">
        <Col lg="1">
          <Form.Control type="text" ref={og_amount} placeholder="OGMax" />
        </Col>
        <Col lg="1">
          <Form.Control type="text" ref={wl_amount} placeholder="WLMax" />
        </Col>
        <Col lg="1">
          <Form.Control type="text" ref={public_amount} placeholder="PLMax" />
        </Col>
        <Col lg="1" className="d-grid">
          <Button type="submit" onClick={changeAmount}>
            Update
          </Button>
        </Col>
      </Row>

      <Row className="inputForm">
        <Col lg="3">
          <Form.Control type="text" ref={base_uri} placeholder="Base URI" />
        </Col>
        <Col lg="1" className="d-grid">
          <Button type="submit" onClick={changeUri}>
            Set
          </Button>
        </Col>
      </Row>

      <Row className="inputForm">
        <Col lg="1">
          <select className="form-control" ref={cur_stage}>
            <option value="0">disabled</option>
            <option value="1">WHITELIST</option>
            <option value="2">PUBLIC</option>
          </select>
        </Col>
        <Col lg="1" className="d-grid">
          <Button type="submit" onClick={changeStage}>
            Set
          </Button>
        </Col>
      </Row>

      <Row className="inputForm">
        <Col lg="1" className="d-grid">
          <Button type="submit" onClick={init}>
            Init
          </Button>
        </Col>
      </Row>

      {loading && (
        <div className="loading">
          <img src="loading.gif" alt="loading" />
        </div>
      )}

      <Row>
        {!loading &&
          view === 'collection' &&
          Object.keys(groupedNfts).map((metadata, index) => (
            <Col xs="12" md="6" lg="2" key={index}>
              <Card
                onClick={() => {
                  setNfts(groupedNfts[metadata]);
                  setView('nft-grid');
                }}
                className="imageGrid"
                lg="3"
                style={{
                  width: '100%',
                  backgroundColor: '#2B3964',
                  padding: '10px',
                  borderRadius: '10px',
                }}
              >
                <Card.Img
                  variant="top"
                  src={groupedNfts[metadata][0]?.image}
                  alt={groupedNfts[metadata][0]?.name}
                  style={{
                    borderRadius: '10px',
                  }}
                />
                <Card.Body>
                  <span>
                    <Card.Title style={{ color: '#fff' }}>
                      {metadata}
                    </Card.Title>
                    <Badge pill bg={props.variant.toLowerCase()} text="light">
                      <h6>{groupedNfts[metadata].length}</h6>
                    </Badge>
                  </span>
                </Card.Body>
              </Card>
            </Col>
          ))}
      </Row>

      {
        <Row>
          {!loading &&
            view === 'nft-grid' &&
            nfts.map((metadata, index) => (
              <Col xs="12" md="6" lg="2" key={index}>
                <Card
                  onClick={() => {
                    console.log(nfts.length);
                  }}
                  className="imageGrid"
                  lg="3"
                  style={{
                    width: '100%',
                    backgroundColor: '#2B3964',
                    padding: '10px',
                    borderRadius: '10px',
                  }}
                >
                  <Card.Img
                    variant="top"
                    src={metadata?.image}
                    alt={metadata?.name}
                  />
                  <Card.Body>
                    <Card.Title style={{ color: '#fff' }}>
                      {metadata?.name}
                    </Card.Title>
                  </Card.Body>
                </Card>
              </Col>
            ))}
        </Row>
      }

      {show && (
        <AlertDismissible title={title} message={message} setShow={setShow} />
      )}
    </div>
  );
}

export default App;
