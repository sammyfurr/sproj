from kubernetes import client, config
import database
import time

class NoOpenChannelError(Exception):
    """Raised when all channels are in use."""
    pass

class NoMatchingChannelError(Exception):
    """Raised when no pod matches a provided channel"""
    pass

class TranslationPodManager:
    def __init__(self, url='localhost', port=27017):
        self.dbc = database.DatabaseController(url, port)
        
        config.load_kube_config()
        self.v1 = client.CoreV1Api()
        
    def create_pod(self, names, image):
        dep = {'apiVersion': 'v1',
               'kind': 'Pod',
               'metadata': {'labels': {'purpose': 'translate-rr'}},
               'spec': {'containers': [{'image': image,
                                        'name': 'rr-test-container',
                                        'command': ['sh'],
                                        'args': ['startup.sh'],
                                        'securityContext': {'capabilities': {'add': ['SYS_PTRACE']}}}],
                        'restartPolicy': 'OnFailure'}}
        channel = self.dbc.add_pod(self.dbc.get_userids_by_name(names))
        dep['metadata']['name'] = channel
        dep['spec']['containers'][0]['args'].append(channel)
        resp = self.v1.create_namespaced_pod(
            body=dep, namespace='default')
        print("Pod created.  status='%s'" % resp.metadata.name)
        # Wait to return the channel until the pod is live and read to
        # recieve incomming communication
        status = self.v1.read_namespaced_pod_status(channel, 'default').status.container_statuses
        while status == None or status[0].state.running == None:
            time.sleep(1)
            status = self.v1.read_namespaced_pod_status(channel, 'default').status.container_statuses
        return channel


    def delete_pod(self, channel):
        """Given a channel, delete a pod"""
        self.v1.delete_namespaced_pod(channel, 'default')
        # Wait for double pod's maximum termination time (30 seconds).
        # Waiting for termination eliminates the scenario where a pod
        # is created with the same channel as a pod that is still
        # terminating.  Creation of the new pod would fail.
        time.sleep(60)
        self.dbc.delete_pod(self.dbc.get_pod_by_channel(channel))
        return

    def link_pod_to_users(self, channel, names):
        pod = self.dbc.get_pod_by_channel(channel)
        uids = self.dbc.get_userids_by_name(names)
        self.dbc.link_pod_to_users(pod, uids)

    def unlink_pod_from_users(self, channel, names):
        pod = self.dbc.get_pod_by_channel(channel)
        uids = self.dbc.get_userids_by_name(names)
        self.dbc.unlink_pod_from_users(pod, uids)

    def get_pods_by_user(self, name):
        uid = self.dbc.get_userid_by_name(name)
        pods = self.dbc.get_pods_by_user(uid)
        active = [p['channel'] for p in pods]
        inactive = []
        return {'active': active, 'inactive': inactive}

    def get_users_by_pod(self, channel):
        pid = self.dbc.get_pod_by_channel(channel);
        uids = self.dbc.get_users_by_pod(pid);
        users = [u['name'] for u in uids]
        return users

    def get_examples(self):
        examples = self.dbc.examples.find()
        if examples == None:
            return {}
        else:
            return {e['name']: e['container'] for e in examples}
